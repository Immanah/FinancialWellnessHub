import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircleIcon,
  BellIcon,
  KeyIcon,
  LockIcon,
  LogOutIcon,
  UserIcon,
  WalletIcon,
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

// Password form schema
const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SettingsPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  
  // Profile form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      username: user?.username || "",
    }
  });

  // Password form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  // Handle profile form submission
  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    // This would typically call an API to update the user's profile
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully."
    });
  };

  // Handle password form submission
  const onPasswordSubmit = (data: z.infer<typeof passwordSchema>) => {
    // This would typically call an API to update the user's password
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully."
    });
    passwordForm.reset();
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your profile and preferences</p>
          </header>
          
          {/* Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid grid-cols-3 lg:grid-cols-5 gap-2">
              <TabsTrigger value="account" className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4" />
                <span>Account</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center space-x-2">
                <KeyIcon className="h-4 w-4" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center space-x-2">
                <BellIcon className="h-4 w-4" />
                <span>Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="banking" className="flex items-center space-x-2">
                <WalletIcon className="h-4 w-4" />
                <span>Banking</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center space-x-2">
                <LockIcon className="h-4 w-4" />
                <span>Privacy</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Account Tab */}
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account profile details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="mt-4">
                        Update Profile
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Account Management</CardTitle>
                  <CardDescription>
                    Manage your account status and deletion options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Log out from all devices</p>
                        <p className="text-sm text-muted-foreground">
                          End all your active sessions on other devices
                        </p>
                      </div>
                      <Button variant="outline">
                        Log out everywhere
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-destructive">Delete account</p>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all associated data
                        </p>
                      </div>
                      <Button variant="destructive">
                        Delete account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to maintain account security
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="mt-4">
                        Update Password
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage additional security features for your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Two-factor authentication</FormLabel>
                        <FormDescription>
                          Add an extra layer of security to your account
                        </FormDescription>
                      </div>
                      <Switch disabled />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Biometric login</FormLabel>
                        <FormDescription>
                          Use fingerprint or face recognition to log in
                        </FormDescription>
                      </div>
                      <Switch disabled />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Login notifications</FormLabel>
                        <FormDescription>
                          Receive alerts for new login attempts
                        </FormDescription>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how and when you receive alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Transaction alerts</FormLabel>
                        <FormDescription>
                          Receive notifications for all account transactions
                        </FormDescription>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Savings goal updates</FormLabel>
                        <FormDescription>
                          Get updates on your progress towards savings goals
                        </FormDescription>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Financial tips</FormLabel>
                        <FormDescription>
                          Receive personalized advice from our AI assistant
                        </FormDescription>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Weekly summary</FormLabel>
                        <FormDescription>
                          Get a weekly overview of your financial activity
                        </FormDescription>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Low balance alerts</FormLabel>
                        <FormDescription>
                          Be notified when your account balance falls below a threshold
                        </FormDescription>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="ml-auto">
                    Save Preferences
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Banking Tab */}
            <TabsContent value="banking">
              <Card>
                <CardHeader>
                  <CardTitle>Banking Preferences</CardTitle>
                  <CardDescription>
                    Manage your account settings and financial preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Default account</FormLabel>
                        <FormDescription>
                          Set your primary account for transactions
                        </FormDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Everyday Spending</p>
                        <p className="text-xs text-muted-foreground">****5678</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Automatic savings</FormLabel>
                        <FormDescription>
                          Automatically transfer funds to savings goals
                        </FormDescription>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Round-up savings</FormLabel>
                        <FormDescription>
                          Round up transactions to the nearest dollar and save the difference
                        </FormDescription>
                      </div>
                      <Switch />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Statement preferences</FormLabel>
                        <FormDescription>
                          Choose how to receive your monthly statements
                        </FormDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Digital only</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="ml-auto">
                    Update Preferences
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Privacy Tab */}
            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>
                    Control how your data is used and shared
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Data analysis</FormLabel>
                        <FormDescription>
                          Allow us to analyze your transactions for personalized insights
                        </FormDescription>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>AI financial advisor</FormLabel>
                        <FormDescription>
                          Use your financial data to provide AI-powered advice
                        </FormDescription>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Marketing communications</FormLabel>
                        <FormDescription>
                          Receive personalized offers based on your financial activity
                        </FormDescription>
                      </div>
                      <Switch />
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <FormLabel>Data export</FormLabel>
                      <FormDescription className="mb-2">
                        Download a copy of all your financial data
                      </FormDescription>
                      <Button variant="outline">
                        Request data export
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="ml-auto">
                    Save Privacy Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Logout Button */}
          <div className="mt-8 flex justify-center">
            <Button 
              variant="outline" 
              className="flex items-center space-x-2 text-destructive"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOutIcon className="h-4 w-4" />
              <span>Log out</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
