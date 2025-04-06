import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '@/context/auth-provider';
import { toast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthContext();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      // Store tokens in localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Decode the access token to get user info
      try {
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
        
        // Create user object from token payload with all required fields
        const userData = {
          id: tokenPayload.id,
          name: tokenPayload.name || 'Google User', // Fallback name if not in token
          email: tokenPayload.email,
          role: tokenPayload.role,
          isActive: true,
          lastLogin: new Date(), // Use Date object instead of string
          WorkspaceId: tokenPayload.WorkspaceId || null, // Get WorkspaceId from token if available
          profilePicture: tokenPayload.profilePicture || null,
          accessToken,
          refreshToken
        };

        // Update auth context
        login(userData);

        // Show success message
        toast({
          title: "Login successful",
          description: "You have been successfully logged in with Google.",
        });

        // Redirect to workspace page if WorkspaceId exists, otherwise to dashboard
        if (userData.WorkspaceId) {
          navigate(`/workspace/${userData.WorkspaceId}`);
        } else {
          // If no workspace, redirect to a page where they can create or join a workspace
          navigate('/workspace');
          toast({
            title: "No Workspace Found",
            description: "You need to create or join a workspace to create tasks.",
            variant: "warning",
          });
        }
      } catch (error) {
        console.error('Error processing token:', error);
        toast({
          title: "Authentication Error",
          description: "There was a problem processing your login. Please try again.",
          variant: "destructive",
        });
        navigate('/');
      }
    } else {
      toast({
        title: "Authentication Error",
        description: "Missing authentication tokens. Please try again.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing your login...</h1>
        <p>Please wait while we redirect you to your workspace.</p>
      </div>
    </div>
  );
};

export default AuthCallback; 