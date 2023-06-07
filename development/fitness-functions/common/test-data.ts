const generateCreateFileDiff = (
  filePath = 'file.txt',
  content = 'Lorem ipsum',
): string => `
diff --git a/${filePath} b/${filePath}
new file mode 100644
index 000000000..30d74d258
--- /dev/null
+++ b/${filePath}
@@ -0,0 +1 @@
+${content}
`;

const generateModifyFilesDiff = (
  filePath = 'file.txt',
  addition = 'Lorem ipsum',
  removal = '',
): string => {
  const additionBlock = addition
    ? `
@@ -1,3 +1,8 @@
+${addition}`.trim()
    : '';

  const removalBlock = removal
    ? `
@@ -34,33 +39,4 @@
-${removal}`.trim()
    : '';

  return `
diff --git a/${filePath} b/${filePath}
index 57d5de75c..808d8ba37 100644
--- a/${filePath}
+++ b/${filePath}
${additionBlock}
${removalBlock}`;
};

export { generateCreateFileDiff, generateModifyFilesDiff };
