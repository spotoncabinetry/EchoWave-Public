import React from 'react';

interface SwitchProps {
    checked: boolean;
    onChange: () => void;
    label?: string;
}

export default function Switch({ checked, onChange, label }: SwitchProps) {
    return (
        <label className="inline-flex items-center space-x-2 cursor-pointer">
            <div
                onClick={onChange}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    checked ? 'bg-blue-600' : 'bg-gray-200'
                }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        checked ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
            </div>
            {label && (
                <span className="text-sm font-medium text-gray-700">
                    {label}
                </span>
            )}
        </label>
    );
}
