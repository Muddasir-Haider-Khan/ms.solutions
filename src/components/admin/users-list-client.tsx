"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Users,
  Key,
  Filter,
  ShieldCheck,
  UserCog,
  User,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
} from "@/actions/users";
import { formatDate } from "@/lib/slugs";

// ============================================================
// Types
// ============================================================

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  isActive: boolean;
  createdAt: Date;
};

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

interface UsersListClientProps {
  users: UserItem[];
  pagination: PaginationData | null;
  currentSearch: string;
  currentRole: string;
}

// ============================================================
// Role Badge Helper
// ============================================================

const roleConfig: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    icon: ShieldCheck,
  },
  ADMIN: {
    label: "Admin",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: UserCog,
  },
  STAFF: {
    label: "Staff",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: User,
  },
  CUSTOMER: {
    label: "Customer",
    color:
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    icon: ShoppingBag,
  },
};

// ============================================================
// Component
// ============================================================

export function UsersListClient({
  users: initialUsers,
  pagination,
  currentSearch,
  currentRole,
}: UsersListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Filters
  const [searchQuery, setSearchQuery] = useState(currentSearch);

  // User list (for client-side refresh after mutations)
  const [users, setUsers] = useState<UserItem[]>(initialUsers);

  // Add user dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF" as string,
    isActive: true,
  });

  // Edit user dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF" as string,
    isActive: true,
  });

  // Change password dialog
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<UserItem | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  // Sync users when server data changes
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  // ============================================================
  // URL Params Helpers
  // ============================================================

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    if (!updates.hasOwnProperty("page")) {
      params.delete("page");
    }
    startTransition(() => {
      router.push(`/users?${params.toString()}`);
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ search: searchQuery });
  }

  function handleRoleFilter(value: string | null) {
    const val = value ?? "ALL";
    updateParams({ role: val === "ALL" ? "" : val });
  }

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    startTransition(() => {
      router.push(`/users?${params.toString()}`);
    });
  }

  // ============================================================
  // Refresh User List
  // ============================================================

  async function refreshUsers() {
    const result = await getUsers({
      search: currentSearch || undefined,
      role: (currentRole || undefined) as
        | "SUPER_ADMIN"
        | "ADMIN"
        | "STAFF"
        | "CUSTOMER"
        | undefined,
      page: pagination?.page ?? 1,
      limit: 20,
    });
    if (result.success && result.data) {
      setUsers(result.data.users);
    }
  }

  // ============================================================
  // Add User
  // ============================================================

  async function handleAddUser() {
    if (!addForm.name || !addForm.email || !addForm.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      const result = await createUser({
        name: addForm.name,
        email: addForm.email,
        password: addForm.password,
        role: addForm.role as "SUPER_ADMIN" | "ADMIN" | "STAFF" | "CUSTOMER",
        isActive: addForm.isActive,
      });

      if (result.success) {
        toast.success("User created successfully");
        setAddOpen(false);
        setAddForm({
          name: "",
          email: "",
          password: "",
          role: "STAFF",
          isActive: true,
        });
        refreshUsers();
      } else {
        toast.error(result.error || "Failed to create user");
      }
    });
  }

  // ============================================================
  // Edit User
  // ============================================================

  function openEditDialog(user: UserItem) {
    setEditUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      isActive: user.isActive,
    });
    setEditOpen(true);
  }

  async function handleEditUser() {
    if (!editUser) return;
    if (!editForm.name || !editForm.email) {
      toast.error("Name and email are required");
      return;
    }

    startTransition(async () => {
      const updateData: Record<string, unknown> = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        isActive: editForm.isActive,
      };

      // Only include password if user entered one
      if (editForm.password) {
        updateData.password = editForm.password;
      }

      const result = await updateUser(editUser.id, updateData as Parameters<typeof updateUser>[1]);

      if (result.success) {
        toast.success("User updated successfully");
        setEditOpen(false);
        setEditUser(null);
        refreshUsers();
      } else {
        toast.error(result.error || "Failed to update user");
      }
    });
  }

  // ============================================================
  // Delete User (soft delete)
  // ============================================================

  async function handleDeleteUser(id: string, userName: string) {
    if (
      !confirm(
        `Are you sure you want to deactivate "${userName}"? They will no longer be able to sign in.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteUser(id);
      if (result.success) {
        toast.success("User deactivated successfully");
        refreshUsers();
      } else {
        toast.error(result.error || "Failed to deactivate user");
      }
    });
  }

  // ============================================================
  // Change Password
  // ============================================================

  function openPasswordDialog(user: UserItem) {
    setPasswordUser(user);
    setPasswordForm({ currentPassword: "", newPassword: "" });
    setPasswordOpen(true);
  }

  async function handleChangePassword() {
    if (!passwordUser) return;
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Please fill in both password fields");
      return;
    }

    startTransition(async () => {
      const result = await changePassword(passwordUser.id, passwordForm);
      if (result.success) {
        toast.success("Password changed successfully");
        setPasswordOpen(false);
        setPasswordUser(null);
      } else {
        toast.error(result.error || "Failed to change password");
      }
    });
  }

  // ============================================================
  // Pagination
  // ============================================================

  const currentPage = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage system users and their roles
          </p>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger
            render={<Button />}
          >
            <Plus className="size-4" />
            Add User
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account with a specific role.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="add-name">Name *</Label>
                <Input
                  id="add-name"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-email">Email *</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={addForm.email}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-password">Password *</Label>
                <Input
                  id="add-password"
                  type="password"
                  value={addForm.password}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Min. 6 characters"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-role">Role *</Label>
                <Select
                  value={addForm.role}
                  onValueChange={(value: string | null) =>
                    setAddForm((prev) => ({ ...prev, role: value ?? "STAFF" }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="add-active"
                  type="checkbox"
                  checked={addForm.isActive}
                  onChange={(e) =>
                    setAddForm((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="rounded border-input"
                />
                <Label htmlFor="add-active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button type="submit" size="default">
                Search
              </Button>
            </form>

            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <Select
                value={currentRole || "ALL"}
                onValueChange={handleRoleFilter}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Users</span>
            {pagination && (
              <span className="text-sm font-normal text-muted-foreground">
                {pagination.total} user{pagination.total !== 1 ? "s" : ""}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const rConfig = roleConfig[user.role] || roleConfig.CUSTOMER;
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <span className="font-medium">{user.name}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[10px] ${rConfig.color}`}
                            variant="outline"
                          >
                            <rConfig.icon className="mr-1 size-3" />
                            {rConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge
                              variant="default"
                              className="bg-green-600 text-white text-[10px]"
                            >
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  disabled={isPending}
                                >
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEditDialog(user)}
                              >
                                <Pencil className="size-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openPasswordDialog(user)}
                              >
                                <Key className="size-4" />
                                Change Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() =>
                                  handleDeleteUser(user.id, user.name)
                                }
                                disabled={!user.isActive}
                              >
                                <Trash2 className="size-4" />
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      {currentPage > 1 && (
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => handlePageChange(currentPage - 1)}
                          />
                        </PaginationItem>
                      )}

                      {Array.from(
                        { length: totalPages },
                        (_, i) => i + 1
                      )
                        .filter((page) => {
                          return (
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 1
                          );
                        })
                        .map((page, index, arr) => {
                          const prev = arr[index - 1];
                          const showEllipsis = prev && page - prev > 1;
                          return (
                            <span
                              key={page}
                              className="flex items-center"
                            >
                              {showEllipsis && (
                                <PaginationItem>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )}
                              <PaginationItem>
                                <PaginationLink
                                  isActive={page === currentPage}
                                  onClick={() => handlePageChange(page)}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            </span>
                          );
                        })}

                      {currentPage < totalPages && (
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(currentPage + 1)}
                          />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="size-12 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-medium">No users found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentSearch || currentRole
                  ? "Try adjusting your search or filter."
                  : "No users have been created yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details. Leave password blank to keep the current one.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="email@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">New Password</Label>
              <Input
                id="edit-password"
                type="password"
                value={editForm.password}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                placeholder="Leave blank to keep current"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role *</Label>
              <Select
                value={editForm.role}
                onValueChange={(value: string | null) =>
                  setEditForm((prev) => ({ ...prev, role: value ?? "STAFF" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="edit-active"
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
                className="rounded border-input"
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Change password for {passwordUser?.name || "user"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cp-current">Current Password *</Label>
              <Input
                id="cp-current"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                placeholder="Enter current password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cp-new">New Password *</Label>
              <Input
                id="cp-new"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                placeholder="Min. 6 characters"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPasswordOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
