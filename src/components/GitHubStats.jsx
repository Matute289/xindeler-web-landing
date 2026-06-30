import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, GitFork, Users, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GitHubIcon from './GitHubIcon';

const REPO            = 'Matute289/xindeler';
const MAX_AVATARS     = 20;
const CONTRIBUTE_API  = 'https://xindeler.com/api/contribute';

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

function ContributeModal({ onClose }) {
  const { t } = useTranslation();
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [skills,    setSkills]    = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [honeypot,  setHoneypot]  = useState('');
  const [status,    setStatus]    = useState('idle');
  const [errMsg,    setErrMsg]    = useState('');

  const canSubmit = name.trim() && email.trim() && skills.trim() && status !== 'loading';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('loading');
    setErrMsg('');
    try {
      const res = await fetch(CONTRIBUTE_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), skills: skills.trim(), portfolio: portfolio.trim(), honeypot }),
      });
      if (res.status === 429) { setErrMsg(t('contribute.errorRate'));    setStatus('error'); return; }
      if (!res.ok)            { setErrMsg(t('contribute.errorGeneric')); setStatus('error'); return; }
      setStatus('success');
    } catch {
      setErrMsg(t('contribute.errorGeneric'));
      setStatus('error');
    }
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-x-navy shadow-2xl"
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        transition={{ duration: 0.25 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-5 border-b border-white/8">
          <h3 className="font-cinzel text-white text-base">{t('contribute.modalTitle')}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-6 gap-4"
              >
                <div className="w-14 h-14 rounded-full border border-emerald-700/40 bg-emerald-900/20 flex items-center justify-center">
                  <CheckCircle2 size={26} className="text-emerald-400" />
                </div>
                <h4 className="font-cinzel text-white">{t('contribute.successTitle')}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{t('contribute.successDesc')}</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Honeypot */}
                <div className="absolute -left-[9999px]" aria-hidden="true">
                  <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="font-cinzel text-xs text-gray-400 tracking-widest uppercase">{t('contribute.name')}</label>
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Tu nombre" maxLength={100} required
                    className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 font-cinzel focus:outline-none focus:border-x-gold/40 transition-all duration-200"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="font-cinzel text-xs text-gray-400 tracking-widest uppercase">{t('contribute.email')}</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com" required
                    className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 font-cinzel focus:outline-none focus:border-x-gold/40 transition-all duration-200"
                  />
                </div>

                {/* Skills */}
                <div className="space-y-1.5">
                  <label className="font-cinzel text-xs text-gray-400 tracking-widest uppercase">{t('contribute.skills')}</label>
                  <textarea
                    value={skills} onChange={e => setSkills(e.target.value)}
                    placeholder={t('contribute.skillsPlaceholder')}
                    maxLength={300} required rows={3}
                    className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 font-cinzel focus:outline-none focus:border-x-gold/40 transition-all duration-200 resize-none"
                  />
                </div>

                {/* Portfolio */}
                <div className="space-y-1.5">
                  <label className="font-cinzel text-xs text-gray-400 tracking-widest uppercase">{t('contribute.portfolio')}</label>
                  <input
                    type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)}
                    placeholder={t('contribute.portfolioPlaceholder')} maxLength={200}
                    className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 font-cinzel focus:outline-none focus:border-x-gold/40 transition-all duration-200"
                  />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {status === 'error' && errMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-rose-400 text-xs font-cinzel"
                    >
                      <AlertCircle size={13} className="flex-shrink-0" />
                      {errMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  type="submit" disabled={!canSubmit}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-cinzel text-sm tracking-widest uppercase transition-all duration-300 ${
                    canSubmit
                      ? 'bg-x-gold text-x-dark hover:bg-x-gold/90 shadow-lg shadow-x-gold/20'
                      : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/8'
                  }`}
                >
                  {status === 'loading' ? <Loader2 size={15} className="animate-spin" /> : null}
                  {status === 'loading' ? t('contribute.sending') : t('contribute.submit')}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function GitHubStats() {
  const { t } = useTranslation();
  const [repo,         setRepo]         = useState(null);
  const [contributors, setContributors] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);
  const [showModal,    setShowModal]    = useState(false);

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
    <>
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
            <StatPill icon={Users}   value={contributors.length > 0 ? `${contributors.length}+` : '—'} label={t('githubStats.contributors')} loading={loading} />
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
                  title={`${c.login} — ${c.contributions} ${c.contributions !== 1 ? t('githubStats.contributions') : t('githubStats.contribution')}`}
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
              <button
                onClick={() => setShowModal(true)}
                className="flex-shrink-0 px-5 py-2.5 rounded-xl border border-x-gold/30 bg-x-gold/8 text-x-gold font-cinzel text-xs tracking-widest uppercase hover:bg-x-gold/15 hover:border-x-gold/50 transition-all duration-200 whitespace-nowrap"
              >
                {t('githubStats.contributeBtn')}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {showModal && <ContributeModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  );
}
