import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, GitFork, Users } from 'lucide-react';
import GitHubIcon from './GitHubIcon';

const REPO = 'Matute289/xindeler';
const MAX_AVATARS = 20;

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
  const [repo, setRepo]         = useState(null);
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

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
              Open Source on GitHub
            </span>
          </div>
          <h2 className="font-cinzel text-2xl md:text-3xl text-white mb-2">
            Built by the Community
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
          <StatPill icon={Star}     value={repo?.stargazers_count ?? 0}  label="Stars"        loading={loading} />
          <StatPill icon={GitFork}  value={repo?.forks_count ?? 0}       label="Forks"        loading={loading} />
          <StatPill icon={Users}    value={contributors.length > 0 ? `${contributors.length}+` : '—'} label="Contributors" loading={loading} />
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
                title={`${c.login} — ${c.contributions} contribution${c.contributions !== 1 ? 's' : ''}`}
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
                {/* Tooltip */}
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

        {/* Loading skeleton avatars */}
        {loading && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-white/8 animate-pulse" />
            ))}
          </div>
        )}

        <motion.div
          className="text-center"
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
            View on GitHub
            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
