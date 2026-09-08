import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { DemoCatalogItem } from "@/features/library/demoCatalog";

export function CheckoutDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: "ebook" | "sop";
  item: DemoCatalogItem;
  onConfirm: () => Promise<void> | void;
}) {
  const { user } = useAuth();
  const { open, onOpenChange, item, itemType, onConfirm } = props;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Demo checkout</AlertDialogTitle>
          <AlertDialogDescription>
            You are purchasing <span className="font-semibold">{item.title}</span> ({itemType.toUpperCase()}) for a demo
            price of <span className="font-semibold">${(item.priceCents / 100).toFixed(2)}</span>. No real money is
            charged.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="hero"
              onClick={async () => {
                if (!user) return;
                await onConfirm();
                onOpenChange(false);
              }}
            >
              Confirm purchase
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
