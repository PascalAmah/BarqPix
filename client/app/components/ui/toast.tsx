import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string) => {
    sonnerToast.success(message, {
      style: {
        background: "hsl(var(--primary-foreground) / 0.2)",
        color: "hsl(var(--primary))",
        border: "1px solid hsl(var(--primary) / 0.2)",
      },
    });
  },
  error: (message: string) => {
    sonnerToast.error(message, {
      style: {
        background: "hsl(var(--primary-foreground) / 0.1)",
        color: "hsl(var(--primary))",
        border: "1px solid hsl(var(--primary) / 0.2)",
      },
    });
  },
};
