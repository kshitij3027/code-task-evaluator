import { Link, Outlet } from 'react-router-dom';
import styles from './Layout.module.css';

export default function Layout() {
  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.brand}>Code Task Evaluator</Link>
        <div className={styles.links}>
          <Link to="/">Dashboard</Link>
          <Link to="/tasks">Tasks</Link>
          <Link to="/tasks/new">Create Task</Link>
        </div>
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
