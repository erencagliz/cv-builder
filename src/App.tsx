import { EditorPage } from './editor/EditorPage';
import { Home } from './editor/Home';
import { ToastProvider, useRoute } from './ui/app';

export default function App() {
  const route = useRoute();
  const edit = /^\/duzenle\/([\w-]+)/.exec(route);
  return <ToastProvider>{edit ? <EditorPage key={edit[1]} id={edit[1]} /> : <Home />}</ToastProvider>;
}
