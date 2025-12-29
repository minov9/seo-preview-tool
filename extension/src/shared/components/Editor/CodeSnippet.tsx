import React from 'react';

interface CodeSnippetProps {
    value: string;
    placeholder?: string;
}

export const CodeSnippet: React.FC<CodeSnippetProps> = ({ value, placeholder }) => {
    const isEmpty = value.trim().length === 0;
    const displayValue = isEmpty ? (placeholder || '') : value;

    return (
        <div
            className={`rounded-lg border border-border-main bg-white px-3 py-2 text-[11px] font-mono whitespace-pre-wrap break-words ${
                isEmpty ? 'text-text-secondary' : 'text-text-main'
            }`}
        >
            {displayValue}
        </div>
    );
};
