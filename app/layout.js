import './styles.css';

export const metadata = { title: 'Dos horas libres', description: 'Una pregunta para todos' };

export default function Layout({ children }) {
  return <html lang="es"><body>{children}</body></html>;
}
