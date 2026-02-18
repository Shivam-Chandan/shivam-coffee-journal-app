import { useState, useEffect } from "react";
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
import { Edit2, Trash2, Calendar, Package, Star, StarHalf, StarOff } from "lucide-react";

interface CoffeeCardProps {
  coffee: Coffee;
  onEdit: (coffee: Coffee) => void;
}

export function CoffeeCard({ coffee, onEdit }: CoffeeCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const [currentRating, setCurrentRating] = useState(coffee.overallTasteRating);
  useEffect(() => {
    setCurrentRating(coffee.overallTasteRating);
  }, [coffee.overallTasteRating]);

  // mutation for updating overall rating directly from card
  const ratingMutation = useMutation({
    mutationFn: (newRating: number) => {
      // include all fields so schema validation passes; id is not sent in body
      const payload = { ...coffee, overallTasteRating: newRating } as any;
      delete payload.id; // backend doesn't expect id in body
      return apiRequest("PATCH", `/api/coffees/${coffee.id}`, payload);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coffees"] });
      toast({
        title: "Updated",
        description: "Overall rating updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update rating",
        variant: "destructive",
      });
    },
  });

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

  const renderStars = (rating: number, editable = false) => {
    // 1-5 scale with half increments
    const value = Math.max(0, Math.min(5, rating));
    const fullStars = Math.floor(value);
    const halfStar = value - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    const stars = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="w-4 h-4 text-yellow-400" fill="currentColor" />
      );
    }
    if (halfStar) {
      stars.push(
        <StarHalf key="half" className="w-4 h-4 text-yellow-400" fill="currentColor" />
      );
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      );
    }
    const containerProps: any = {
      className: `flex items-center gap-0.5${editable ? ' cursor-pointer' : ''}`,
      'data-testid': `stars-${coffee.id}`,
    };
    if (editable) {
      containerProps.onClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        let newRating = Math.round((x / rect.width) * 10) / 2;
        newRating = Math.max(1, Math.min(5, newRating));
        setCurrentRating(newRating);
        ratingMutation.mutate(newRating);
      };
    }
    return <div {...containerProps}>{stars}</div>;
  };

  return (
    <>
      <Card className="overflow-hidden" data-testid={`card-coffee-${coffee.id}`}>
        <CardHeader className="space-y-2 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold leading-tight" data-testid={`text-coffee-name-${coffee.id}`}>
                {coffee.coffeeName}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid={`text-brand-${coffee.id}`}>
                {coffee.brandName}
              </p>
            </div>
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
              <span data-testid={`text-quantity-${coffee.id}`}>
                {coffee.quantity}{coffee.quantityUnit === "kg" ? " kg" : " g"}
              </span>
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
          {/* Overall rating stars (clickable) */}
          <div className="flex items-center gap-2">
            {renderStars(currentRating, true)}
            <span className="text-xs text-muted-foreground" data-testid={`text-overall-${coffee.id}`}>
              {currentRating.toFixed(1)}/5
            </span>
          </div>

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
              Are you sure you want to delete "
              {coffee.coffeeName} - {coffee.brandName}
              "? This action cannot be undone.
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
