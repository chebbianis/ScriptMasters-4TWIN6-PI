import AppRoutes from "./routes";
import { TestConnection } from './components/TestConnection';

function App() {
  return (
    <div className="app">
      <AppRoutes />
      <TestConnection />
    </div>
  );
}

export default App;
