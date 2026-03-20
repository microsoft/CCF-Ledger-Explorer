/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the Apache License, Version 2.0.
 */

import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Text,
  Card,
  CardHeader,
  Badge,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Tooltip,
  MessageBar,
  MessageBarBody,
  Divider,
} from '@fluentui/react-components';
import {
  CopyRegular,
  CheckmarkRegular,
  ArrowDownloadRegular,
  ArrowLeftRegular,
} from '@fluentui/react-icons';
import type { GeneratedScript } from '../../types/storage-connection-types';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    maxWidth: '900px',
  },
  codeBlock: {
    backgroundColor: tokens.colorNeutralBackground3,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    overflowX: 'auto',
  },
  codeWrapper: {
    position: 'relative' as const,
  },
  copyButton: {
    position: 'absolute' as const,
    top: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalS,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
  stepDescription: {
    marginBottom: tokens.spacingVerticalS,
  },
  panelContent: {
    padding: tokens.spacingHorizontalM,
  },
});

interface GeneratedScriptsProps {
  scripts: GeneratedScript[];
  fullScript: string;
  onBack: () => void;
}

export function GeneratedScripts({ scripts, fullScript, onBack }: GeneratedScriptsProps) {
  const styles = useStyles();
  const [copiedIndex, setCopiedIndex] = useState<number | 'full' | null>(null);

  const copyToClipboard = async (text: string, index: number | 'full') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback for insecure contexts
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const downloadScript = () => {
    const blob = new Blob([fullScript], { type: 'text/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'connect-storage-account.sh';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.root}>
      <MessageBar intent="warning">
        <MessageBarBody>
          These commands require <strong>Azure CLI</strong> with an authenticated session (
          <code>az login</code>). The executing identity needs <strong>Owner</strong> or{' '}
          <strong>Contributor + User Access Administrator</strong> on the storage account resource
          group, and <strong>Reader</strong> on the managed resource group.
        </MessageBarBody>
      </MessageBar>

      {/* Step-by-step accordion */}
      <Card>
        <CardHeader
          header={<Text weight="semibold" size={400}>Step-by-Step Commands</Text>}
          description="Run each step in order, or download the full script below."
        />
        <Accordion multiple defaultOpenItems={['0']}>
          {scripts.map((script, index) => (
            <AccordionItem key={index} value={String(index)}>
              <AccordionHeader>
                <Badge appearance="filled" color="brand" style={{ marginRight: tokens.spacingHorizontalS }}>
                  {index + 1}
                </Badge>
                {script.label.replace(/^Step \d+: /, '')}
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.panelContent}>
                  <Text size={200} className={styles.stepDescription} block>
                    {script.description}
                  </Text>
                  <div className={styles.codeWrapper}>
                    <div className={styles.codeBlock}>
                      {script.command}
                    </div>
                    <Tooltip
                      content={copiedIndex === index ? 'Copied!' : 'Copy to clipboard'}
                      relationship="label"
                    >
                      <Button
                        className={styles.copyButton}
                        icon={copiedIndex === index ? <CheckmarkRegular /> : <CopyRegular />}
                        appearance="subtle"
                        size="small"
                        onClick={() => copyToClipboard(script.command, index)}
                        aria-label={`Copy step ${index + 1} command`}
                      />
                    </Tooltip>
                  </div>
                </div>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>

      <Divider />

      {/* Full script */}
      <Card>
        <CardHeader
          header={<Text weight="semibold" size={400}>Full Script</Text>}
          description="All commands combined into a single Bash script."
        />
        <div className={styles.codeWrapper}>
          <div className={styles.codeBlock}>
            {fullScript}
          </div>
          <Tooltip
            content={copiedIndex === 'full' ? 'Copied!' : 'Copy full script'}
            relationship="label"
          >
            <Button
              className={styles.copyButton}
              icon={copiedIndex === 'full' ? <CheckmarkRegular /> : <CopyRegular />}
              appearance="subtle"
              size="small"
              onClick={() => copyToClipboard(fullScript, 'full')}
              aria-label="Copy full script"
            />
          </Tooltip>
        </div>
      </Card>

      <div className={styles.actions}>
        <Button
          appearance="secondary"
          icon={<ArrowLeftRegular />}
          onClick={onBack}
        >
          Back to Form
        </Button>
        <Button
          appearance="primary"
          icon={<ArrowDownloadRegular />}
          onClick={downloadScript}
        >
          Download Script
        </Button>
        <Button
          appearance="subtle"
          icon={copiedIndex === 'full' ? <CheckmarkRegular /> : <CopyRegular />}
          onClick={() => copyToClipboard(fullScript, 'full')}
        >
          {copiedIndex === 'full' ? 'Copied!' : 'Copy All'}
        </Button>
      </div>
    </div>
  );
}
