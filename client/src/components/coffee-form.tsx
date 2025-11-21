import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertCoffeeSchema, type Coffee, type InsertCoffee } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CoffeeFormProps {
  coffee?: Coffee | null;
  onSuccess?: () => void;
}

export function CoffeeForm({ coffee, onSuccess }: CoffeeFormProps) {
  const { toast } = useToast();
  
  const form = useForm<InsertCoffee>({
    resolver: zodResolver(insertCoffeeSchema),
    defaultValues: {
      brandName: coffee?.brandName || "",
      quantity: coffee?.quantity || "",
      orderDate: coffee?.orderDate || new Date().toISOString().split('T')[0],
      roast: coffee?.roast || "",
      formFactor: coffee?.formFactor || "",
      notes: coffee?.notes || "",
      bitternessRating: coffee?.bitternessRating || 5,
      acidityRating: coffee?.acidityRating || 5,
      noteClarityRating: coffee?.noteClarityRating || 5,
      overallTasteRating: coffee?.overallTasteRating || 5,
      worthReordering: coffee?.worthReordering || 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertCoffee) => apiRequest("POST", "/api/coffees", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coffees"] });
      toast({
        title: "Success!",
        description: "Coffee added to your journal",
      });
      form.reset();
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add coffee. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertCoffee) => 
      apiRequest("PATCH", `/api/coffees/${coffee?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coffees"] });
      toast({
        title: "Success!",
        description: "Coffee updated successfully",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update coffee. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCoffee) => {
    if (coffee) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="brandName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Lavazza, Illy, Blue Bottle" 
                    {...field} 
                    data-testid="input-brand-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 250g, 1kg" 
                      {...field} 
                      data-testid="input-quantity"
                    />
                  </FormControl>
                  <FormDescription>
                    e.g., 250g, 1kg
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="orderDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      data-testid="input-order-date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="roast"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roast Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-roast">
                        <SelectValue placeholder="Select roast level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Light" data-testid="option-roast-light">Light</SelectItem>
                      <SelectItem value="Medium" data-testid="option-roast-medium">Medium</SelectItem>
                      <SelectItem value="Medium-Dark" data-testid="option-roast-medium-dark">Medium-Dark</SelectItem>
                      <SelectItem value="Dark" data-testid="option-roast-dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="formFactor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Form Factor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-form-factor">
                        <SelectValue placeholder="Select form" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Whole Beans" data-testid="option-form-beans">Whole Beans</SelectItem>
                      <SelectItem value="Pre-Ground" data-testid="option-form-ground">Pre-Ground</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tasting Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the flavor profile, aroma, body, etc."
                    className="resize-none min-h-24"
                    {...field}
                    data-testid="input-notes"
                  />
                </FormControl>
                <FormDescription>
                  What flavors and aromas do you notice?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Ratings Section */}
        <div className="space-y-6 pt-4 border-t">
          <h3 className="text-lg font-semibold">Rate This Coffee</h3>
          
          <FormField
            control={form.control}
            name="bitternessRating"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel>Bitterness</FormLabel>
                  <span className="text-sm font-medium" data-testid="text-bitterness-value">
                    {field.value}/10
                  </span>
                </div>
                <FormControl>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    data-testid="slider-bitterness"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acidityRating"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel>Acidity</FormLabel>
                  <span className="text-sm font-medium" data-testid="text-acidity-value">
                    {field.value}/10
                  </span>
                </div>
                <FormControl>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    data-testid="slider-acidity"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="noteClarityRating"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel>Note Clarity</FormLabel>
                  <span className="text-sm font-medium" data-testid="text-note-clarity-value">
                    {field.value}/10
                  </span>
                </div>
                <FormControl>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    data-testid="slider-note-clarity"
                  />
                </FormControl>
                <FormDescription>
                  How well can you taste the described notes?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="overallTasteRating"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel>Overall Taste</FormLabel>
                  <span className="text-sm font-medium" data-testid="text-overall-taste-value">
                    {field.value}/10
                  </span>
                </div>
                <FormControl>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    data-testid="slider-overall-taste"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Reorder Decision */}
        <div className="pt-4 border-t">
          <FormField
            control={form.control}
            name="worthReordering"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Worth Reordering?</FormLabel>
                  <FormDescription>
                    Would you buy this coffee again?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value === 1}
                    onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                    data-testid="switch-reorder"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <Button 
            type="submit" 
            className="flex-1" 
            disabled={isPending}
            data-testid="button-submit"
          >
            {isPending ? "Saving..." : coffee ? "Update Coffee" : "Add Coffee"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
