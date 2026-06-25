import { createClient } from "@/lib/supabase/server";
import { CategoryFormDialog } from "@/components/admin/category-form-dialog";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { deleteCategory } from "@/app/(app)/admin/categories/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Categorias</h1>
        <CategoryFormDialog />
      </div>
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {category.description}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <CategoryFormDialog category={category} />
                    <ConfirmDeleteButton
                      itemLabel={`a categoria "${category.name}"`}
                      action={deleteCategory.bind(null, category.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!categories || categories.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground"
                >
                  Nenhuma categoria cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
