import { useState } from "react";
import { useListUsers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, UserCog, MoreHorizontal, ShieldAlert } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Settings() {
  const { data: users, isLoading } = useListUsers();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Settings</h2>
        <p className="text-gray-400 text-sm">Manage team access and platform configuration.</p>
      </div>

      <Card className="bg-[#13131a]/80 backdrop-blur border-white/5 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
          <CardTitle className="text-lg font-semibold text-white flex items-center">
            <UserCog className="w-5 h-5 mr-2 text-indigo-400" /> Team Management
          </CardTitle>
          <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/10">
            <Plus className="w-4 h-4 mr-2" /> Invite User
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-gray-400 font-medium">User</TableHead>
                <TableHead className="text-gray-400 font-medium">Role</TableHead>
                <TableHead className="text-gray-400 font-medium">Status</TableHead>
                <TableHead className="text-gray-400 font-medium">Joined</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full bg-white/5" />
                      <div>
                        <Skeleton className="h-4 w-[120px] bg-white/5 mb-1" />
                        <Skeleton className="h-3 w-[150px] bg-white/5" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-[70px] bg-white/5 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[60px] bg-white/5 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px] bg-white/5" /></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : (
                users?.map((user) => (
                  <TableRow key={user.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-white/10">
                          <AvatarImage src={user.avatarUrl || ""} />
                          <AvatarFallback className="bg-indigo-950 text-indigo-200 text-xs">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-200">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`
                        capitalize
                        ${user.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
                          user.role === 'client' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'}
                      `}>
                        {user.role === 'admin' && <ShieldAlert className="w-3 h-3 mr-1" />}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-normal">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20 font-normal">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10">
                        <MoreHorizontal className="h-4 w-4" />
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
  );
}