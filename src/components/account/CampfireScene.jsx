import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { classColor } from '../../lib/classPresentation';
import { getCampfireLayout } from '../../lib/campfireLayout';

const LOG_ANGLES = [-128, -68, -8, 52, 112, 172];

function CampfireFire() {
    return (
        <div className="absolute left-1/2 top-[81%] w-1 h-1 z-[4]">
            {LOG_ANGLES.map((angle) => (
                <div
                    key={angle}
                    className="absolute left-0 -top-1.5 h-3 w-[60px] rounded-md"
                    style={{
                        transformOrigin: '6px center',
                        transform: `rotate(${angle}deg)`,
                        background:
                            'linear-gradient(to right, #fff3c4 0%, #ff8c28 20%, #b5330f 45%, #5a2415 75%, #362018 100%)',
                        boxShadow:
                            '0 0 10px 2px rgba(255,120,40,0.3), inset 0 -2px 3px rgba(0,0,0,0.35), inset 0 2px 2px rgba(255,255,255,0.15)',
                    }}
                />
            ))}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[22px] h-[9px] rounded-full blur-[1px] animate-campfire-core-pulse"
                style={{ background: 'radial-gradient(ellipse, #fff3c4, #ff8c28 55%, transparent 80%)' }}
            />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[330px] h-[250px] rounded-full animate-campfire-pulse"
                style={{ background: 'radial-gradient(ellipse, rgba(255,150,50,0.36), rgba(255,110,30,0.12) 45%, transparent 70%)' }}
            />
            <div className="absolute left-1/2 bottom-1 -ml-[29px] w-[58px] h-[96px] rounded-[50%_50%_42%_42%] animate-campfire-flicker-outer"
                style={{ transformOrigin: 'bottom center', background: 'linear-gradient(0deg, #b5330f, #ff8c28 55%, #ffcf6b 90%)' }}
            />
            <div className="absolute left-1/2 bottom-1 -ml-[19px] w-[38px] h-[68px] rounded-[50%_50%_42%_42%] animate-campfire-flicker-mid"
                style={{ transformOrigin: 'bottom center', background: 'linear-gradient(0deg, #ff8c28, #ffd873 70%)' }}
            />
            <div className="absolute left-1/2 bottom-1 -ml-[10.5px] w-[21px] h-[40px] rounded-[50%_50%_42%_42%] animate-campfire-flicker-inner"
                style={{ transformOrigin: 'bottom center', background: 'linear-gradient(0deg, #ffb347, #fff3c4 80%)' }}
            />
            {[
                { ex: '16px', delay: '0s', left: 'calc(50% - 6px)' },
                { ex: '-20px', delay: '1s', left: 'calc(50% + 4px)' },
                { ex: '10px', delay: '2s', left: '50%' },
            ].map((ember) => (
                <div
                    key={ember.left}
                    className="absolute bottom-4 w-1 h-1 rounded-full animate-campfire-ember-rise"
                    style={{
                        left: ember.left,
                        animationDelay: ember.delay,
                        '--ember-x': ember.ex,
                        background: '#ffcf6b',
                        boxShadow: '0 0 8px 2px rgba(255,180,80,0.8)',
                    }}
                />
            ))}
        </div>
    );
}

function SceneCharacter({ character, layout, hovered, onHover, onSelect }) {
    const { t } = useTranslation();
    const color = classColor(character.class);
    return (
        <div
            className="absolute flex flex-col items-center cursor-pointer"
            style={{
                left: `calc(50% + ${layout.dx}px)`,
                bottom: `calc(20% + ${layout.dy}px)`,
                transform: `translateX(-50%) scale(${layout.scale})`,
                transformOrigin: 'bottom center',
                zIndex: layout.z,
            }}
            onMouseEnter={() => onHover(character.character_id)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(character)}
        >
            {hovered && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-x-dark/95 border border-x-gold/40 text-x-gold-2 font-cinzel text-xs tracking-wider uppercase px-5 py-1.5 rounded whitespace-nowrap z-[5]">
                    {t('account.characters.scene.selectTooltip')}
                </div>
            )}
            <div
                className="w-[76px] h-[76px] rounded-full flex items-center justify-center font-cinzel text-2xl font-bold text-black mb-3"
                style={{ background: `linear-gradient(160deg, ${color}, ${color}cc)` }}
            >
                {character.level}
            </div>
            <div className="w-[108px] h-[208px] relative" style={{ filter: hovered ? `drop-shadow(0 0 20px ${color})` : undefined }}>
                <div className="w-12 h-12 rounded-full mx-auto" style={{ background: `${color}cc` }} />
                <div
                    className="w-[92px] h-32 mx-auto mt-2"
                    style={{
                        background: `linear-gradient(160deg, ${color}, ${color}88)`,
                        clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
                    }}
                />
            </div>
            <div className={`mt-1 font-cinzel text-2xl tracking-wide ${hovered ? 'text-x-gold-2' : 'text-gray-300'}`}
                style={{ textShadow: '0 0 8px rgba(0,0,0,0.9)' }}
            >
                {character.name}
            </div>
        </div>
    );
}

export default function CampfireScene({ characters, onSelectCharacter }) {
    const [hoveredId, setHoveredId] = useState(null);
    const layout = getCampfireLayout(characters.length);

    return (
        <div
            className="relative w-full rounded-xl overflow-hidden"
            style={{ aspectRatio: '1406 / 788', backgroundImage: 'url(/campfire-scene-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            {characters.map((character, index) => (
                <SceneCharacter
                    key={character.character_id}
                    character={character}
                    layout={layout[index]}
                    hovered={hoveredId === character.character_id}
                    onHover={setHoveredId}
                    onSelect={onSelectCharacter}
                />
            ))}
            <CampfireFire />
        </div>
    );
}
