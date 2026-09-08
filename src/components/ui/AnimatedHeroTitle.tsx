import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const words = ["Learn", "Lead", "Build", "Grow", "Excel"];

export function AnimatedHeroTitle({ className }: { className?: string }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, 3000); // Change word every 3 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <h1
            className={cn(
                "mt-6 text-4xl font-black tracking-tight xs:text-5xl sm:text-6xl lg:text-5xl xl:text-6xl 2xl:text-7xl 2xl:leading-[1.1]",
                className
            )}
        >
            <span className="block sm:inline">Guiding You</span>{" "}
            <span className="inline-flex items-baseline">
                to{" "}
                <span className="relative ml-2 inline-grid overflow-hidden text-primary transition-all duration-300">
                    {/* Map all words as invisible to ensure the container is as wide as the widest word */}
                    {words.map((word) => (
                        <span key={word} className="invisible col-start-1 row-start-1 whitespace-nowrap px-2">
                            {word}
                        </span>
                    ))}
                    <span
                        key={index}
                        className="absolute inset-0 flex items-center col-start-1 row-start-1 animate-in fade-in slide-in-from-bottom-2 duration-700 fill-mode-forwards px-2"
                    >
                        {words[index]}
                    </span>
                </span>
            </span>
        </h1>
    );
}
