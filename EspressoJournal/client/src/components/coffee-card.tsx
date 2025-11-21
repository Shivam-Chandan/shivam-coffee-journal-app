import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Coffee } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Edit2, Trash2, Calendar, Package } from "lucide-react";

interface CoffeeCardProps {
  coffee: Coffee;
  onEdit: (coffee: Coffee) => void;
}

export function CoffeeCard({ coffee, onEdit }: CoffeeCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/coffees/${coffee.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coffees"] });
      toast({
        title: "Coffee deleted",
        description: "Coffee entry has been removed from your journal",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete coffee. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <>
      <Card className="overflow-hidden" data-testid={`card-coffee-${coffee.id}`}>
        <CardHeader className="space-y-2 pb-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold leading-tight" data-testid={`text-brand-${coffee.id}`}>
              {coffee.brandName}
            </h3>
            {coffee.worthReordering === 1 && (
              <Badge variant="default" className="shrink-0" data-testid={`badge-reorder-${coffee.id}`}>
                Reorder
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span data-testid={`text-date-${coffee.id}`}>{formatDate(coffee.orderDate)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Package className="w-4 h-4" />
              <span data-testid={`text-quantity-${coffee.id}`}>{coffee.quantity}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Badge variant="secondary" data-testid={`badge-roast-${coffee.id}`}>
              {coffee.roast}
            </Badge>
            <Badge variant="secondary" data-testid={`badge-form-${coffee.id}`}>
              {coffee.formFactor}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pb-4">
          {/* Tasting Notes */}
          <div>
            <p className="text-sm font-medium mb-1">Tasting Notes</p>
            <p className="text-sm text-muted-foreground italic line-clamp-3" data-testid={`text-notes-${coffee.id}`}>
              {coffee.notes}
            </p>
          </div>

          {/* Ratings */}
          <div className="space-y-2.5">
            <p className="text-sm font-medium">Ratings</p>
            
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Bitterness</span>
                  <span className="font-medium" data-testid={`text-bitterness-${coffee.id}`}>
                    {coffee.bitternessRating}/10
                  </span>
                </div>
                <Progress value={coffee.bitternessRating * 10} className="h-1.5" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Acidity</span>
                  <span className="font-medium" data-testid={`text-acidity-${coffee.id}`}>
                    {coffee.acidityRating}/10
                  </span>
                </div>
                <Progress value={coffee.acidityRating * 10} className="h-1.5" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Note Clarity</span>
                  <span className="font-medium" data-testid={`text-note-clarity-${coffee.id}`}>
                    {coffee.noteClarityRating}/10
                  </span>
                </div>
                <Progress value={coffee.noteClarityRating * 10} className="h-1.5" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Overall Taste</span>
                  <span className="font-medium" data-testid={`text-overall-${coffee.id}`}>
                    {coffee.overallTasteRating}/10
                  </span>
                </div>
                <Progress value={coffee.overallTasteRating * 10} className="h-1.5" />
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => onEdit(coffee)}
            data-testid={`button-edit-${coffee.id}`}
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => setShowDeleteDialog(true)}
            data-testid={`button-delete-${coffee.id}`}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-delete-title">Delete Coffee?</AlertDialogTitle>
            <AlertDialogDescription data-testid="text-delete-description">
              Are you sure you want to delete "{coffee.brandName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
