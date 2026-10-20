import { EditorPage } from './editor/EditorPage';
import { Home } from './editor/Home';
import { Viewer } from './share/Viewer';
import { ToastProvider, useRoute } from './ui/app';

export default function App() {
  const route = useRoute();
  const edit = /^\/duzenle\/([\w-]+)/.exec(route);
  return <ToastProvider>{edit ? <EditorPage key={edit[1]} id={edit[1]} /> : route.startsWith('/goruntule') ? <Viewer /> : <Home />}</ToastProvider>;
}
