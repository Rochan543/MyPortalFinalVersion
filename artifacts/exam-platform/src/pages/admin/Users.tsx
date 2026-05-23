import React, { useState } from "react";
import { useGetUsers, useDeleteUser, getGetUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Trash, Shield, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminUsers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetUsers({ 
    search: search || undefined, 
    page,
    limit: 10
  });

  const deleteMutation = useDeleteUser();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this user? All their attempts will be lost.")) {
      deleteMutation.mutate(
        { userId: id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
            toast({ title: "User deleted" });
          },
          onError: (err) => {
            toast({ title: "Failed to delete user", description: err.message, variant: "destructive" });
          }
        }
      );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Manage Users</h2>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or username..."
              className="pl-8"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell></TableRow>
                ) : !data?.users?.length ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">No users found</TableCell></TableRow>
                ) : (
                  data.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {user.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          {user.fullName}
                        </div>
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        {user.role === 'ADMIN' ? (
                          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">
                            <Shield className="mr-1 h-3 w-3" /> Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <UserIcon className="mr-1 h-3 w-3" /> Student
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(user.id)}
                          disabled={user.role === 'ADMIN'} // Prevent deleting admins
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
