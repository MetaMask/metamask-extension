#!/usr/bin/env python3
"""Plan a GitHub suggestion review for an E2E API mock drift diff.

Suggestions can only be attached to lines that are already in the pull
request diff, and only a complete drift is suggested. Anything else is a
fallback: the workflow comments the diff and the local sync command.
"""

import argparse
import hashlib
import json
import re
import subprocess
import sys

MAX_COMMENTS = 30
MAX_SUGGESTION_CHARS = 60000
MAX_TOTAL_CHARS = 200000
# Merge hunks separated by at most this many unchanged lines when they sit
# in the same pull request hunk. Far-apart edits stay separate.
COALESCE_GAP = 2

REVIEW_MARKER = '<!-- e2e-api-mock-sync-review -->'
HUNK_HEADER = re.compile(
    r'^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@'
)


class Fallback(Exception):
    """The drift cannot be expressed as suggestion comments."""


def parse_unified_diff(text):
    """Return {path: [hunk, ...]} from a git unified diff.

    Each hunk is (old_start, old_count, new_lines). old_count 0 is an insert
    after old_start (or before the file when old_start is 0).
    """
    files = {}
    path = None
    hunks = []
    current = None

    def finish_hunk():
        nonlocal current
        if current is not None:
            hunks.append(current)
            current = None

    def finish_file():
        nonlocal path, hunks
        finish_hunk()
        if path is not None:
            files[path] = hunks
        path = None
        hunks = []

    for line in text.splitlines():
        if line.startswith('diff --git '):
            finish_file()
            continue
        if line.startswith('Binary files '):
            raise Fallback(
                'A drifted file is binary, so it cannot be suggested.'
            )
        if line.startswith('+++ '):
            name = line[4:]
            if name == '/dev/null':
                raise Fallback(
                    'A drifted file was deleted. Commit suggestion cannot delete a file.'
                )
            if name.startswith('b/'):
                name = name[2:]
            path = name
            continue
        header = HUNK_HEADER.match(line)
        if header:
            finish_hunk()
            old_start = int(header.group(1))
            old_count = int(header.group(2)) if header.group(2) else 1
            current = (old_start, old_count, [])
            continue
        if current is None or line.startswith('\\'):
            continue
        if line.startswith('+'):
            current[2].append(line[1:])
        elif line.startswith('-') or line.startswith(' '):
            continue
    finish_file()
    if not files:
        raise Fallback('The drift diff is empty.')
    return files


def commentable_ranges(patch):
    """Inclusive right-side line ranges GitHub will accept a comment on."""
    if not patch:
        return []
    ranges = []
    for line in patch.splitlines():
        header = HUNK_HEADER.match(line)
        if not header:
            continue
        start = int(header.group(3))
        count = int(header.group(4)) if header.group(4) else 1
        if count <= 0 or start <= 0:
            continue
        ranges.append((start, start + count - 1))
    return ranges


def suggestion_body(lines):
    if any('```' in line for line in lines):
        raise Fallback(
            'A suggested line contains a code fence, so the comment would break.'
        )
    if not lines:
        return '```suggestion\n```'
    return '```suggestion\n' + '\n'.join(lines) + '\n```'


def normalize_hunk(old_start, old_count, new_lines, original_lines):
    """Turn one diff hunk into (start, end, replacement) on the HEAD file.

    start and end are inclusive 1-based lines the suggestion replaces.
    """
    if old_count == 0 and old_start == 0:
        if not original_lines:
            raise Fallback(
                'A new line would be inserted into an empty file, which has no line to comment on.'
            )
        return (1, 1, list(new_lines) + [original_lines[0]])
    if old_count == 0:
        if old_start < 1 or old_start > len(original_lines):
            raise Fallback(
                f'An insertion after line {old_start} does not match the file at this commit.'
            )
        return (
            old_start,
            old_start,
            [original_lines[old_start - 1]] + list(new_lines),
        )
    end = old_start + old_count - 1
    if old_start < 1 or end > len(original_lines):
        raise Fallback(
            f'Lines {old_start}-{end} do not match the file at this commit.'
        )
    return (old_start, end, list(new_lines))


def covering(ranges, start, end):
    for left, right in ranges:
        if left <= start and end <= right:
            return (left, right)
    return None


def merge_hunks(normalized, original_lines, ranges):
    """normalized items are (start, end, new_lines). Return merged ones."""
    placed = []
    for start, end, new_lines in normalized:
        span = covering(ranges, start, end)
        if span is None:
            raise Fallback(
                f'lines {start}-{end} are not in this pull request diff'
            )
        placed.append((start, end, new_lines, span))

    merged = []
    for start, end, new_lines, span in placed:
        if (
            merged
            and merged[-1]['span'] == span
            and start - merged[-1]['end'] - 1 <= COALESCE_GAP
        ):
            previous = merged[-1]
            gap = original_lines[previous['end'] : start - 1]
            previous['end'] = end
            previous['lines'].extend(gap)
            previous['lines'].extend(new_lines)
        else:
            merged.append(
                {
                    'start': start,
                    'end': end,
                    'lines': list(new_lines),
                    'span': span,
                }
            )
    return merged


def comment_for(path, block):
    body = suggestion_body(block['lines'])
    if len(body) > MAX_SUGGESTION_CHARS:
        raise Fallback(
            f'A suggestion for {path} would be {len(body)} characters, which is too large to comment.'
        )
    comment = {
        'path': path,
        'body': body,
        'side': 'RIGHT',
        'line': block['end'],
    }
    if block['start'] < block['end']:
        comment['start_line'] = block['start']
        comment['start_side'] = 'RIGHT'
    return comment


def build_plan(diff_text, pr_files, originals, readable):
    """Return a suggestion plan, or a fallback plan. Never raises Fallback."""
    try:
        return suggestion_plan(diff_text, pr_files, originals, readable)
    except Fallback as error:
        return {
            'mode': 'fallback',
            'reason': str(error),
            'hash': '',
            'body': '',
            'comments': [],
        }


def suggestion_plan(diff_text, pr_files, originals, readable):
    files = parse_unified_diff(diff_text)
    by_name = {entry['filename']: entry for entry in pr_files}
    comments = []
    for path in sorted(files):
        entry = by_name.get(path)
        if entry is None:
            raise Fallback(
                f'{path} is not in this pull request diff, so a suggestion cannot be attached. '
                'Run `yarn test:e2e:sync-api-mocks` and commit the result.'
            )
        if not entry.get('patch'):
            raise Fallback(
                f'{path} is in this pull request, but GitHub omitted its diff because it is too large to comment on. '
                'Run `yarn test:e2e:sync-api-mocks` and commit the result.'
            )
        original = originals.get(path, '')
        original_lines = original.splitlines()
        normalized = [
            normalize_hunk(start, count, new_lines, original_lines)
            for start, count, new_lines in files[path]
        ]
        try:
            merged = merge_hunks(
                normalized, original_lines, commentable_ranges(entry['patch'])
            )
        except Fallback as error:
            raise Fallback(
                f'{path} {error}. Run `yarn test:e2e:sync-api-mocks` and commit the result.'
            ) from error
        for block in merged:
            comments.append(comment_for(path, block))

    if len(comments) > MAX_COMMENTS:
        raise Fallback(
            f'This drift would need {len(comments)} suggestions, which is too many to commit from a review. '
            'Run `yarn test:e2e:sync-api-mocks` and commit the result.'
        )
    total = sum(len(comment['body']) for comment in comments)
    if total > MAX_TOTAL_CHARS:
        raise Fallback(
            f'The suggestions would be {total} characters, which is too large for one review. '
            'Run `yarn test:e2e:sync-api-mocks` and commit the result.'
        )

    digest = hashlib.sha256(
        json.dumps(comments, sort_keys=True).encode()
    ).hexdigest()
    summary = readable.strip()
    body = '\n'.join(
        [
            REVIEW_MARKER,
            f'<!-- e2e-api-mock-sync-review-hash:{digest} -->',
            '',
            'E2E API mock fixtures differ from the live response shapes. Apply the suggestions on this review and commit them. That commit is authored by you, so the other checks run without a maintainer approval.',
            '',
            'The change is shape-only: existing values stay, new fields are placeholders, and removed fields are dropped.',
            '',
            'Or run `yarn test:e2e:sync-api-mocks` and commit that result.',
            '',
            summary,
        ]
    )
    return {
        'mode': 'suggestions',
        'reason': '',
        'hash': digest,
        'body': body,
        'comments': comments,
    }


def load_originals(paths):
    originals = {}
    for path in paths:
        result = subprocess.run(
            ['git', 'show', f'HEAD:{path}'],
            check=False,
            capture_output=True,
            text=True,
        )
        originals[path] = result.stdout if result.returncode == 0 else ''
    return originals


def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('--diff', required=True)
    parser.add_argument('--files', required=True)
    parser.add_argument('--readable', required=True)
    parser.add_argument('--out', required=True)
    args = parser.parse_args(argv)
    diff_text = open(args.diff, encoding='utf-8').read()
    pr_files = json.load(open(args.files, encoding='utf-8'))
    readable = open(args.readable, encoding='utf-8').read()
    try:
        paths = parse_unified_diff(diff_text).keys()
    except Fallback:
        paths = []
    originals = load_originals(paths)
    plan = build_plan(diff_text, pr_files, originals, readable)
    with open(args.out, 'w', encoding='utf-8') as handle:
        json.dump(plan, handle)
    return 0


def self_test():
    """Build real git diffs and check suggestion versus fallback."""
    import tempfile
    from pathlib import Path

    def git_diff(before, after):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            subprocess.run(['git', 'init', '-q'], cwd=root, check=True)
            subprocess.run(
                ['git', 'config', 'user.email', 't@t'], cwd=root, check=True
            )
            subprocess.run(
                ['git', 'config', 'user.name', 't'], cwd=root, check=True
            )
            file_path = root / 'f.txt'
            file_path.write_text(before)
            subprocess.run(['git', 'add', 'f.txt'], cwd=root, check=True)
            subprocess.run(
                ['git', 'commit', '-q', '-m', 'init'], cwd=root, check=True
            )
            file_path.write_text(after)
            diff = subprocess.run(
                ['git', 'diff', '-U0'],
                cwd=root,
                check=True,
                capture_output=True,
                text=True,
            ).stdout.replace('f.txt', 'fixture.json')
            # git still says a/f.txt b/f.txt. Rewrite paths.
            diff = diff.replace('a/f.txt', 'a/fixture.json').replace(
                'b/f.txt', 'b/fixture.json'
            )
            return diff, before

    whole = '@@ -0,0 +1,3 @@\n+a\n+b\n+c\n'
    files = [{'filename': 'fixture.json', 'patch': whole}]

    diff, before = git_diff('a\nb\nc\n', 'a\nB\nc\n')
    plan = build_plan(diff, files, {'fixture.json': before}, '- **id**: added x')
    assert plan['mode'] == 'suggestions', plan
    assert plan['comments'][0]['line'] == 2
    assert 'start_line' not in plan['comments'][0]
    assert plan['comments'][0]['body'] == '```suggestion\nB\n```'

    diff, before = git_diff('a\nb\nc\n', 'a\nX\nb\nc\n')
    plan = build_plan(diff, files, {'fixture.json': before}, 'report')
    assert plan['mode'] == 'suggestions', plan
    assert plan['comments'][0]['body'] == '```suggestion\na\nX\n```'
    assert plan['comments'][0]['line'] == 1

    diff, before = git_diff('a\nb\nc\n', 'Z\na\nb\nc\n')
    plan = build_plan(diff, files, {'fixture.json': before}, 'report')
    assert plan['mode'] == 'suggestions', plan
    assert plan['comments'][0]['body'] == '```suggestion\nZ\na\n```'

    diff, before = git_diff('a\nb\nc\n', 'a\nc\n')
    plan = build_plan(diff, files, {'fixture.json': before}, 'report')
    assert plan['mode'] == 'suggestions', plan
    assert plan['comments'][0]['body'] == '```suggestion\n```'
    assert plan['comments'][0]['line'] == 2

    diff, before = git_diff('a\nb\nc\n', 'A\nb\nC\n')
    plan = build_plan(diff, files, {'fixture.json': before}, 'report')
    assert plan['mode'] == 'suggestions', plan
    assert len(plan['comments']) == 1
    assert plan['comments'][0]['start_line'] == 1
    assert plan['comments'][0]['line'] == 3
    assert plan['comments'][0]['body'] == '```suggestion\nA\nb\nC\n```'

    narrow = [{'filename': 'fixture.json', 'patch': '@@ -2 +2 @@\n-b\n+b\n'}]
    diff, before = git_diff('a\nb\nc\n', 'A\nb\nc\n')
    plan = build_plan(diff, narrow, {'fixture.json': before}, 'report')
    assert plan['mode'] == 'fallback', plan
    assert 'not in this pull request diff' in plan['reason']

    diff, before = git_diff('a\nb\nc\n', 'a\nB\nc\n')
    plan = build_plan(diff, [], {'fixture.json': before}, 'report')
    assert plan['mode'] == 'fallback'
    assert 'not in this pull request diff' in plan['reason']

    omitted = [{'filename': 'fixture.json', 'patch': None}]
    plan = build_plan(diff, omitted, {'fixture.json': before}, 'report')
    assert plan['mode'] == 'fallback'
    assert 'too large to comment' in plan['reason']

    # Thirty-one edits, each separated by more than COALESCE_GAP lines.
    source_lines = [str(index) for index in range(1, 200)]
    original = '\n'.join(source_lines) + '\n'
    changed_lines = list(source_lines)
    for index in range(0, 31 * 5, 5):
        changed_lines[index] = changed_lines[index] + 'x'
    changed = '\n'.join(changed_lines) + '\n'
    wide = '@@ -0,0 +1,199 @@\n' + '\n'.join(f'+{line}' for line in source_lines)
    diff, before = git_diff(original, changed)
    plan = build_plan(
        diff,
        [{'filename': 'fixture.json', 'patch': wide + '\n'}],
        {'fixture.json': before},
        'report',
    )
    assert plan['mode'] == 'fallback', plan
    assert 'too many' in plan['reason']

    # Hash stability:
    diff, before = git_diff('a\nb\nc\n', 'a\nB\nc\n')
    first = build_plan(diff, files, {'fixture.json': before}, 'report')
    second = build_plan(diff, files, {'fixture.json': before}, 'report')
    assert first['hash'] == second['hash']
    assert REVIEW_MARKER in first['body']
    assert first['hash'] in first['body']

    print('self-test ok')
    print('example suggestion:')
    print(first['comments'][0]['body'])
    return 0


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--self-test':
        sys.exit(self_test())
    sys.exit(main(sys.argv[1:]))
