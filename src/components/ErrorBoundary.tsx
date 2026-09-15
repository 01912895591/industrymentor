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

        // Check if error is due to stale/missing Vite chunks after a new deployment
        const isChunkError =
            error.message?.includes('Failed to fetch dynamically imported module') ||
            error.message?.includes('error loading dynamically imported module') ||
            error.message?.includes('Loading chunk') ||
            error.message?.includes('Importing a module script failed') ||
            error.name === 'ChunkLoadError';

        if (isChunkError) {
            const hasAutoReloaded = sessionStorage.getItem('chunk_reload_once');
            if (!hasAutoReloaded) {
                sessionStorage.setItem('chunk_reload_once', 'true');
                console.warn('Stale chunk detected after deployment. Auto-reloading page...');
                window.location.reload();
            }
        }
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const isChunkError =
                this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
                this.state.error?.message?.includes('Loading chunk') ||
                this.state.error?.name === 'ChunkLoadError';

            return (
                <div className="flex min-h-screen items-center justify-center p-4 bg-background">
                    <Card className="max-w-md w-full border-border/80 shadow-lg">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                                <CardTitle>
                                    {isChunkError ? 'New Update Available' : 'Something went wrong'}
                                </CardTitle>
                            </div>
                            <CardDescription>
                                {isChunkError
                                    ? 'A new version of IndustryMentor was deployed. Please refresh to load the latest update.'
                                    : 'An unexpected error occurred. Please try refreshing the page.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {this.state.error && (
                                <details className="mt-2" open={!isChunkError}>
                                    <summary className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground">
                                        Error details
                                    </summary>
                                    <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-muted p-3 text-[11px] font-mono overflow-auto max-h-36">
                                        {this.state.error.message}
                                    </pre>
                                </details>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            <Button
                                onClick={() => {
                                    sessionStorage.removeItem('chunk_reload_once');
                                    window.location.reload();
                                }}
                                className="w-full font-bold"
                            >
                                Refresh Page
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    window.location.href = '/';
                                }}
                                className="w-full text-xs"
                            >
                                Return to Homepage
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
