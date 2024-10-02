import styles from "./page.module.css";
import { GroupChat } from "../components/group-chat";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <GroupChat />
      </main>
    </div>
  );
}
