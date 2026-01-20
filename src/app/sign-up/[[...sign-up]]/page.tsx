import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <SignUp
                appearance={{
                    elements: {
                        formButtonPrimary:
                            "bg-primary hover:bg-primary/90 text-primary-foreground text-sm normal-case",
                        card: "shadow-none border-none bg-transparent",
                        headerTitle: "text-foreground",
                        headerSubtitle: "text-muted-foreground",
                        socialButtonsBlockButton:
                            "bg-background border-border text-foreground hover:bg-muted text-sm normal-case",
                        formFieldLabel: "text-foreground",
                        formFieldInput:
                            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                        footerActionLink: "text-primary hover:text-primary/90",
                    },
                }}
            />
        </div>
    );
}
