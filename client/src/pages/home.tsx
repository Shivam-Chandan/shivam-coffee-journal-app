import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Coffee } from "@shared/schema";
import { CoffeeForm } from "@/components/coffee-form";
import { CoffeeCard } from "@/components/coffee-card";
import { Button } from "@/components/ui/button";
import { Coffee as CoffeeIcon, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Home() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoffee, setEditingCoffee] = useState<Coffee | null>(null);

  const { data: coffees = [], isLoading } = useQuery<Coffee[]>({
    queryKey: ["/api/coffees"],
  });

  const handleEdit = (coffee: Coffee) => {
    setEditingCoffee(coffee);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCoffee(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <CoffeeIcon className="w-8 h-8 text-primary" data-testid="icon-coffee" />
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              Shivam's Coffee Journal
            </h1>
          </div>
          <p className="text-muted-foreground" data-testid="text-subtitle">
            {coffees.length} {coffees.length === 1 ? 'coffee' : 'coffees'} tracked
          </p>
        </header>

        {/* Add Coffee Button */}
        <div className="mb-8">
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="gap-2" 
                data-testid="button-add-coffee"
                onClick={() => setEditingCoffee(null)}
              >
                <Plus className="w-5 h-5" />
                Add New Coffee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle data-testid="text-form-title">
                  {editingCoffee ? 'Edit Coffee' : 'Add New Coffee'}
                </DialogTitle>
              </DialogHeader>
              <CoffeeForm 
                coffee={editingCoffee} 
                onSuccess={handleCloseForm}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Coffee Grid or Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="h-96 bg-card rounded-lg animate-pulse"
                data-testid={`skeleton-card-${i}`}
              />
            ))}
          </div>
        ) : coffees.length === 0 ? (
          <div className="text-center py-16" data-testid="empty-state">
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <CoffeeIcon className="w-12 h-12 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-2" data-testid="text-empty-title">
              No coffees yet
            </h2>
            <p className="text-muted-foreground mb-6" data-testid="text-empty-description">
              Start tracking your espresso journey by adding your first coffee
            </p>
            <Button 
              onClick={() => setIsFormOpen(true)} 
              className="gap-2"
              data-testid="button-add-first-coffee"
            >
              <Plus className="w-5 h-5" />
              Add Your First Coffee
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coffees.map((coffee) => (
              <CoffeeCard 
                key={coffee.id} 
                coffee={coffee} 
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
