import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import PendingBanner from './PendingBanner';
import MemberProfileModal from './MemberProfileModal';
import ManifestoModal from './ManifestoModal';
import { s } from './shared';

export default function AppLayout() {
  return (
    <div style={s.wrap}>
      <Navbar />
      <PendingBanner />
      <Outlet />
      <MemberProfileModal />
      <ManifestoModal />
    </div>
  );
}
