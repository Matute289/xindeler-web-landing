import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, GitFork, Users, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GitHubIcon from './GitHubIcon';

const REPO        = 'Matute289/xindeler';
const MAX_AVATARS = 20;
const CONTACT_MAIL = 'maticgrinberg@gmail.com';

function mailtoHref(t) {
  const subject = encodeURIComponent(t('githubStats.contributeTitle'));
  const body    = encodeURIComponent(
    `Hola,\n\nMe gustaría contribuir a Xindeler.\n\nNombre: \nSkills / área de interés: \nGitHub / portfolio (opcional): \n`
  );
  return `mailto:${CONTACT_MAIL}?subject=${subject}&body=${body}`;
}

function StatPill({ icon: Icon, value, label, loading }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-white/8 bg-white/3">
      <Icon size={16} className="text-x-gold flex-shrink-0" strokeWidth={1.8} />
      <div>
        <p className="font-cinzel text-white text-sm font-semibold leading-none">
          {loading ? <span className="inline-block w-6 h-3 bg-white/10 rounded animate-pulse" /> : value}
        </p>
        <p className="text-gray-500 text-xs mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function GitHubStats() {
  const { t } = useTranslation();
  const [repo,         setRepo]         = useState(null);
  const [contributors, setContributors] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);

  useEffect(() => {
    const headers = { Accept: 'application/vnd.github+json' };
    Promise.all([
      fetch(`https://api.github.com/repos/${REPO}`, { headers }).then(r => r.json()),
      fetch(`https://api.github.com/repos/${REPO}/contributors?per_page=50`, { headers }).then(r => r.json()),
    ])
      .then(([repoData, contribData]) => {
        if (repoData.message) throw new Error(repoData.message);
        setRepo(repoData);
        setContributors(Array.isArray(contribData) ? contribData : []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (error) return null;

  const visible   = contributors.slice(0, MAX_AVATARS);
  const remaining = Math.max(0, (repo?.subscribers_count ?? 0) + contributors.length - MAX_AVATARS);

  return (
    <section className="py-20 bg-x-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,_rgba(124,58,237,0.06)_0%,_transparent_70%)] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <GitHubIcon size={18} className="text-white/60" />
            <span className="font-cinzel text-gray-400 text-xs tracking-[0.3em] uppercase">
              {t('githubStats.openSource')}
            </span>
          </div>
          <h2 className="font-cinzel text-2xl md:text-3xl text-white mb-2">
            {t('githubStats.title')}
          </h2>
          <div className="w-12 h-px bg-x-gold mx-auto" />
        </motion.div>

        {/* Stats */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <StatPill icon={Star}    value={repo?.stargazers_count ?? 0} label={t('githubStats.stars')}        loading={loading} />
          <StatPill icon={GitFork} value={repo?.forks_count ?? 0}      label={t('githubStats.forks')}        loading={loading} />
          <StatPill icon={Users}   value={contributors.length > 0 ? `${contributors.length}+` : '—'}         label={t('githubStats.contributors')} loading={loading} />
        </motion.div>

        {/* Avatar grid */}
        {!loading && contributors.length > 0 && (
          <motion.div
            className="flex flex-wrap justify-center gap-2 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {visible.map((c, i) => (
              <motion.a
                key={c.id}
                href={c.html_url}
                target="_blank"
                rel="noopener noreferrer"
                title={`${c.login} — ${c.contributions} ${c.contributions !== 1 ? t('githubStats.contributions_plural') : t('githubStats.contributions')}`}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
                whileHover={{ scale: 1.15, zIndex: 10 }}
                className="relative group"
              >
                <img
                  src={c.avatar_url}
                  alt={c.login}
                  className="w-10 h-10 rounded-full border-2 border-white/10 group-hover:border-x-gold/60 transition-all duration-200 object-cover"
                  loading="lazy"
                />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-x-navy border border-white/10 text-white text-xs font-cinzel px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                  {c.login}
                </span>
              </motion.a>
            ))}
            {remaining > 0 && (
              <div className="w-10 h-10 rounded-full border-2 border-white/10 bg-white/5 flex items-center justify-center text-gray-400 text-xs font-cinzel">
                +{remaining}
              </div>
            )}
          </motion.div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-white/8 animate-pulse" />
            ))}
          </div>
        )}

        {/* Footer: view on GitHub + contribute CTA */}
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <a
            href={`https://github.com/${REPO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-cinzel text-xs tracking-widest uppercase text-gray-400 hover:text-x-gold transition-colors duration-300 group"
          >
            <GitHubIcon size={14} />
            {t('githubStats.viewOnGitHub')}
            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
          </a>

          {/* Contribute CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-4 px-8 py-5 rounded-2xl border border-white/8 bg-white/2 max-w-lg w-full"
          >
            <div className="flex-1 text-center sm:text-left">
              <p className="font-cinzel text-sm text-white/85">{t('githubStats.contributeTitle')}</p>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">{t('githubStats.contributeDesc')}</p>
            </div>
            <a
              href={mailtoHref(t)}
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-x-gold/30 bg-x-gold/8 text-x-gold font-cinzel text-xs tracking-widest uppercase hover:bg-x-gold/15 hover:border-x-gold/50 transition-all duration-200 whitespace-nowrap"
            >
              <Mail size={13} />
              {t('githubStats.contributeBtn')}
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
