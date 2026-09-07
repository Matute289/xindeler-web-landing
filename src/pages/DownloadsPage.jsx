import { useTranslation } from 'react-i18next';
import DownloadsHeader from '../components/DownloadsHeader';
import DownloadSection from '../components/DownloadSection';

const API_BASE = 'https://xindeler.com/api';

export default function DownloadsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-x-dark">
      <DownloadsHeader />
      <main className="pt-16 md:pt-20">
        <DownloadSection
          apiBase={API_BASE}
          heading={t('downloadsPage.title')}
          eyebrow={t('downloadsPage.eyebrow')}
        />
      </main>
    </div>
  );
}
