import AppRoutes from "./routes";
import { TestConnection } from './components/TestConnection';
import { Chatbot } from './components/chatbot';

function App() {
  return (
    <div className="app">
      <AppRoutes />
      <TestConnection />
      <Chatbot />
    </div>
  );
}

export default App;
