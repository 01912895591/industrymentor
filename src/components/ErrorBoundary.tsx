import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-screen items-center justify-center p-4">
                    <Card className="max-w-md">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                                <CardTitle>Something went wrong</CardTitle>
                            </div>
                            <CardDescription>
                                An unexpected error occurred. Please try refreshing the page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {this.state.error && (
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                                        Error details
                                    </summary>
                                    <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs">
                                        {this.state.error.message}
                                    </pre>
                                </details>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full"
                            >
                                Refresh Page
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
