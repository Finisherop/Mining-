import { useEffect } from 'react';
import Layout from './components/Layout';
import { useToast, ToastContainer } from './hooks/useToast';
import { useAppStore } from './store';

function App() {
  const { updateFarmingEarnings } = useAppStore();
  
  // Initialize toast notifications
  useToast();

  // Update farming earnings periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updateFarmingEarnings();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [updateFarmingEarnings]);

  return (
    <div className="App">
      <Layout />
      <ToastContainer />
    </div>
  );
}

export default App;