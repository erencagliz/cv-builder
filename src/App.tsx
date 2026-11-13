import { EditorPage } from './editor/EditorPage';
import { Home } from './editor/Home';
import { Viewer } from './share/Viewer';
import { ToastProvider } from './ui/ToastProvider';
import { useRoute } from './ui/router';

export default function App() {
  const route = useRoute();
  return (
    <ToastProvider>
      {route.name === 'edit' && route.id ? <EditorPage key={route.id} id={route.id} /> : route.name === 'view' ? <Viewer /> : <Home />}
    </ToastProvider>
  );
}
