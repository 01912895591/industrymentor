import { useState } from "react";

export interface ConfirmationConfig {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void | Promise<void>;
}

export function useConfirmation() {
    const [config, setConfig] = useState<ConfirmationConfig | null>(null);

    const confirm = (newConfig: ConfirmationConfig) => {
        setConfig(newConfig);
    };

    const handleConfirm = async () => {
        if (config?.onConfirm) {
            await config.onConfirm();
        }
        setConfig(null);
    };

    const handleCancel = () => {
        setConfig(null);
    };

    return {
        confirm,
        confirmConfig: config,
        handleConfirm,
        handleCancel,
        isOpen: config !== null,
    };
}
