import { SignIn } from "@clerk/nextjs";
import { AuthLayout } from "@/components/auth-layout";

export default function SignInPage() {
    return (
        <AuthLayout>
            <SignIn
                appearance={{
                    elements: {
                        rootBox: "w-full",
                        card: "shadow-none border-none bg-transparent p-0 w-full",
                        header: "hidden",
                        footer: "hidden",
                        // Removed gradient, using solid primary color for cleaner look
                        formButtonPrimary:
                            "bg-primary text-primary-foreground hover:bg-primary/90 w-full h-10 rounded-md font-medium transition-colors shadow-sm",
                        socialButtonsBlockButton:
                            "bg-background border border-input text-foreground hover:bg-accent hover:text-accent-foreground h-10 w-full rounded-md transition-colors",
                        socialButtonsBlockButtonText: "font-medium",
                        formFieldLabel: "text-sm font-medium text-foreground",
                        formFieldInput:
                            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        footerActionLink: "text-primary hover:text-primary/90 font-medium underline-offset-4 hover:underline",
                        identityPreviewText: "text-foreground font-medium",
                        formHeaderTitle: "hidden",
                        formHeaderSubtitle: "hidden",
                    },
                    layout: {
                        socialButtonsPlacement: "top",
                        socialButtonsVariant: "blockButton",
                    },
                }}
            />
        </AuthLayout>
    );
}
