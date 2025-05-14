
import { Navigate } from 'react-router-dom';

const Index = () => {
  // Just redirect to the main dashboard
  return <Navigate to="/" replace />;
};

export default Index;
