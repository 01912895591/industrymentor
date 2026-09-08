/**
 * Input Validation and Sanitization Utilities
 * Ensures data integrity and prevents common security vulnerabilities
 */

export const validators = {
    /**
     * Validate email format
     */
    isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate URL format
     */
    isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Validate price (must be non-negative number)
     */
    isValidPrice(price: number): boolean {
        return Number.isFinite(price) && price >= 0;
    },

    /**
     * Validate string length
     */
    isValidLength(str: string, min: number, max: number): boolean {
        const len = str.trim().length;
        return len >= min && len <= max;
    },

    /**
     * Validate UUID format
     */
    isValidUUID(uuid: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    },

    /**
     * Validate course data before submission
     */
    validateCourseData(data: {
        title?: string;
        slug?: string;
        price_cents?: number;
    }): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.title || !validators.isValidLength(data.title, 1, 200)) {
            errors.push('Title must be between 1 and 200 characters');
        }

        if (!data.slug || !validators.isValidLength(data.slug, 1, 200)) {
            errors.push('Slug is required');
        }

        if (data.price_cents !== undefined && !validators.isValidPrice(data.price_cents)) {
            errors.push('Invalid price');
        }

        return { valid: errors.length === 0, errors };
    },

    /**
     * Validate blog data before submission
     */
    validateBlogData(data: {
        title?: string;
        slug?: string;
        content?: string;
    }): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.title || !validators.isValidLength(data.title, 1, 300)) {
            errors.push('Title must be between 1 and 300 characters');
        }

        if (!data.slug || !validators.isValidLength(data.slug, 1, 300)) {
            errors.push('Slug is required');
        }

        return { valid: errors.length === 0, errors };
    },

    /**
     * Validate library item data
     */
    validateLibraryItemData(data: {
        title?: string;
        item_key?: string;
        price_cents?: number;
    }): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.title || !validators.isValidLength(data.title, 1, 200)) {
            errors.push('Title must be between 1 and 200 characters');
        }

        if (!data.item_key || !validators.isValidLength(data.item_key, 1, 200)) {
            errors.push('Item key is required');
        }

        if (data.price_cents !== undefined && !validators.isValidPrice(data.price_cents)) {
            errors.push('Invalid price');
        }

        return { valid: errors.length === 0, errors };
    },
};

export const sanitizers = {
    /**
     * Sanitize string by trimming and removing dangerous characters
     */
    sanitizeString(input: string): string {
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove angle brackets to prevent XSS
            .substring(0, 10000); // Limit length
    },

    /**
     * Sanitize number input
     */
    sanitizeNumber(input: string | number): number {
        const num = typeof input === 'string' ? parseFloat(input) : input;
        return Number.isFinite(num) ? num : 0;
    },

    /**
     * Sanitize cents (price) - ensure it's a non-negative integer
     */
    sanitizeCents(input: string | number): number {
        const num = this.sanitizeNumber(input);
        return Math.max(0, Math.round(num));
    },

    /**
     * Sanitize URL - ensure it's valid or return empty string
     */
    sanitizeUrl(input: string): string {
        const trimmed = input.trim();
        if (!trimmed) return '';
        try {
            const url = new URL(trimmed);
            return url.toString();
        } catch {
            return '';
        }
    },

    /**
     * Generate slug from title
     */
    generateSlug(title: string): string {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    },
};
