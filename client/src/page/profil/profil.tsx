import { useState, useEffect, FormEvent } from "react";
import { useAuthContext } from "@/context/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateProfileMutationFn, updatePasswordMutationFn } from "@/lib/api";

const Profile = () => {
  const { user, updateUser } = useAuthContext();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");



  useEffect(() => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    try {
      if (!user?.email) throw new Error("User not authenticated");

      const backendData = {
        currentEmail: user.email,
        name: formData.name,
        newEmail: formData.email
      };

      const updatedUser = await updateProfileMutationFn(backendData);

      if (!updatedUser?.id) {
        throw new Error("Error updating profile");
      }

      updateUser(updatedUser);
      setProfileSuccess("Profile updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Profile update error:", error);
      setProfileError(error.message);
    }
  };

  const handlePasswordUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (!user?.email) {
      setPasswordError("Email not defined.");
      return;
    }

    try {
      const data = {
        email: user.email,
        currentPassword,
        newPassword,
      };
      const res = await updatePasswordMutationFn(data);
      setPasswordSuccess(res.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Password error:", error);
      setPasswordError(
        error.response?.data?.error || "Error updating password"
      );
    }
  };

  const getInitials = () => {
    if (!user) return "U";
    const nameParts = user.name?.split(" ") || [];
    return (
      (nameParts[0]?.[0] || user.email[0] || "U") +
      (nameParts[1]?.[0] || "")
    ).toUpperCase();
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4 pt-6">
          <CardTitle className="text-2xl font-bold text-center">
            {isEditing ? "Edit Profile" : "User Profile"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Information Tab */}
            <TabsContent value="info" className="space-y-8">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                    <AvatarFallback className="text-2xl bg-blue-500 text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 w-full">
                  {isEditing ? (
                    <form onSubmit={handleSave} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      {profileError && (
                        <p className="text-red-500 text-sm">{profileError}</p>
                      )}
                      {profileSuccess && (
                        <p className="text-green-500 text-sm">{profileSuccess}</p>
                      )}
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Name</h3>
                          <p className="mt-1 text-base font-medium">{user?.name}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Email</h3>
                          <p className="mt-1 text-base">{user?.email}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Role</h3>
                          <p className="mt-1 text-base">{user?.role}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">
                            Member since
                          </h3>
                          <p className="mt-1 text-base">
                            {new Date(user?.createdAt || "").toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="mt-6 bg-blue-600 hover:bg-blue-700"
                      >
                        Edit Profile
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    {passwordError && (
                      <p className="text-red-500 text-sm">{passwordError}</p>
                    )}
                    {passwordSuccess && (
                      <p className="text-green-500 text-sm">{passwordSuccess}</p>
                    )}
                    <Button type="submit" className="mt-2 bg-blue-600 hover:bg-blue-700">
                      Update
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;