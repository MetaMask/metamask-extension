#!/usr/bin/env python3
"""One-shot locale edit for PSAFE-509 (en + en_GB). Deleted after use."""
import collections
import json

DELETIONS = [
    "blockaidTitleDeceptive",
    "blockaidTitleSuspicious",
    "blockaidDescriptionSeaportFarming",
    "blockaidDescriptionBlurFarming",
    "blockaidDescriptionMightLoseAssets",
    "blockaidAlertDescriptionWithdraw",
    "blockaidAlertDescriptionTokenTransfer",
    "blockaidAlertDescriptionOpenSea",
    "blockaidAlertDescriptionBlur",
    "blockaidAlertDescriptionMalicious",
    "blockaidAlertDescriptionOthers",
]

VALUE_EDITS = {
    "blockaidDescriptionApproveFarming": "You're giving another address permission to move your assets.",
    "blockaidDescriptionTransferFarming": "You're sending assets to an address flagged by security partners. If this is a scam, your funds can't be recovered.",
    "blockaidDescriptionMaliciousDomain": "Security partners flag this site as malicious. If this is a scam, your funds can't be recovered.",
    "blockaidDescriptionErrored": "We couldn't complete this safety check. Continue only if you trust the site and addresses involved.",
    "blockaidTitleMayNotBeSafe": "Security check unavailable",
    "confirmationAlertModalTitleDescription": "High-risk request",
}

ADDITIONS = {
    "blockaidAlertModalMessage": {
        "message": "Security partners found high-risk signals in this $1. If you continue, your funds can't be recovered.",
        "description": "$1 is a request type noun such as approval, transfer, signature or request",
    },
    "blockaidAlertModalMessageWithAmount": {
        "message": "Security partners found high-risk signals in this $1. If you continue, your $2 can't be recovered.",
        "description": "$1 is a request type noun such as approval, transfer, signature or request; $2 is the formatted fiat value at risk",
    },
    "blockaidDescriptionHighRiskSignature": {
        "message": "Security partners flag this signature as high risk. Signing could authorize actions with your assets without your permission.",
    },
    "blockaidDescriptionMaliciousDomainWithAmount": {
        "message": "Security partners flag this site as malicious. If this is a scam, your $1 can't be recovered.",
        "description": "$1 is the formatted fiat value at risk",
    },
    "blockaidDescriptionMarketplaceFarming": {
        "message": "You're giving another address permission to move your assets listed on $1.",
        "description": "$1 is a marketplace name such as OpenSea or Blur",
    },
    "blockaidDescriptionRiskSignals": {
        "message": "Security partners found risk signals in this request. Review before continuing.",
    },
    "blockaidDescriptionTransferFarmingWithAmount": {
        "message": "You're sending assets to an address flagged by security partners. If this is a scam, your $1 can't be recovered.",
        "description": "$1 is the formatted fiat value at risk",
    },
    "blockaidRequestTypeApproval": {
        "message": "approval",
        "description": "Noun inserted into blockaidAlertModalMessage as $1",
    },
    "blockaidRequestTypeRequest": {
        "message": "request",
        "description": "Noun inserted into blockaidAlertModalMessage as $1",
    },
    "blockaidRequestTypeSignature": {
        "message": "signature",
        "description": "Noun inserted into blockaidAlertModalMessage as $1",
    },
    "blockaidRequestTypeTransfer": {
        "message": "transfer",
        "description": "Noun inserted into blockaidAlertModalMessage as $1",
    },
    "blockaidTitleHighRiskApproval": {"message": "High-risk approval"},
    "blockaidTitleHighRiskSignature": {"message": "High-risk signature"},
    "blockaidTitleHighRiskTransfer": {"message": "High-risk transfer"},
    "blockaidTitleRiskSignalsDetected": {"message": "Risk signals detected"},
    "blockaidTitleSiteFlaggedUnsafe": {"message": "Site flagged as unsafe"},
}


def edit(path, is_en):
    with open(path) as f:
        m = json.load(f, object_pairs_hook=collections.OrderedDict)

    for key in DELETIONS:
        m.pop(key, None)

    for key, message in VALUE_EDITS.items():
        if key in m:
            m[key]["message"] = message

    merged = collections.OrderedDict()
    additions = dict(ADDITIONS)
    pending = sorted(additions)
    existing = list(m.keys())
    idx = 0
    for k in existing:
        while idx < len(pending) and pending[idx] < k:
            merged[pending[idx]] = collections.OrderedDict(
                additions[pending[idx]]
            )
            idx += 1
        merged[k] = m[k]
    while idx < len(pending):
        merged[pending[idx]] = collections.OrderedDict(additions[pending[idx]])
        idx += 1

    with open(path, "w") as f:
        f.write(json.dumps(merged, indent=2, ensure_ascii=False) + "\n")
    print(f"{path}: -{len(DELETIONS)} ~{len(VALUE_EDITS)} +{len(ADDITIONS)}")


edit("app/_locales/en/messages.json", True)
edit("app/_locales/en_GB/messages.json", False)
