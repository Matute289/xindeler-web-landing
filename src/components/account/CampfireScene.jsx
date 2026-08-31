import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { classColor } from '../../lib/classPresentation';
import { getCampfireLayout } from '../../lib/campfireLayout';

const LOG_ANGLES = [-128, -68, -8, 52, 112, 172];

// All layout numbers in this file were tuned by eye against a 1406px-wide
// mockup (see getCampfireLayout's own header comment and the design spec).
// cqw ties every one of them to the scene container's own width instead of
// the viewport, so the exact same composition renders at any container
// size -- from the 512px account modal up to a full-width desktop layout --
// rather than just the width it happened to be designed at.
const CANVAS_WIDTH = 1406;
const cqw = (px) => `${((px / CANVAS_WIDTH) * 100).toFixed(4)}cqw`;

function CampfireFire() {
    return (
        <div className="absolute left-1/2 top-[81%] z-[4]" style={{ width: cqw(4), height: cqw(4) }}>
            {LOG_ANGLES.map((angle) => (
                <div
                    key={angle}
                    className="absolute left-0 rounded-md"
                    style={{
                        top: `-${cqw(6)}`,
                        height: cqw(12),
                        width: cqw(60),
                        transformOrigin: `${cqw(6)} center`,
                        transform: `rotate(${angle}deg)`,
                        background:
                            'linear-gradient(to right, #fff3c4 0%, #ff8c28 20%, #b5330f 45%, #5a2415 75%, #362018 100%)',
                        boxShadow:
                            '0 0 10px 2px rgba(255,120,40,0.3), inset 0 -2px 3px rgba(0,0,0,0.35), inset 0 2px 2px rgba(255,255,255,0.15)',
                    }}
                />
            ))}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[1px] animate-campfire-core-pulse"
                style={{
                    width: cqw(22),
                    height: cqw(9),
                    background: 'radial-gradient(ellipse, #fff3c4, #ff8c28 55%, transparent 80%)',
                }}
            />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-campfire-pulse"
                style={{
                    width: cqw(330),
                    height: cqw(250),
                    background: 'radial-gradient(ellipse, rgba(255,150,50,0.36), rgba(255,110,30,0.12) 45%, transparent 70%)',
                }}
            />
            <div className="absolute left-1/2 bottom-1 rounded-[50%_50%_42%_42%] animate-campfire-flicker-outer"
                style={{
                    marginLeft: `-${cqw(29)}`,
                    width: cqw(58),
                    height: cqw(96),
                    transformOrigin: 'bottom center',
                    background: 'linear-gradient(0deg, #b5330f, #ff8c28 55%, #ffcf6b 90%)',
                }}
            />
            <div className="absolute left-1/2 bottom-1 rounded-[50%_50%_42%_42%] animate-campfire-flicker-mid"
                style={{
                    marginLeft: `-${cqw(19)}`,
                    width: cqw(38),
                    height: cqw(68),
                    transformOrigin: 'bottom center',
                    background: 'linear-gradient(0deg, #ff8c28, #ffd873 70%)',
                }}
            />
            <div className="absolute left-1/2 bottom-1 rounded-[50%_50%_42%_42%] animate-campfire-flicker-inner"
                style={{
                    marginLeft: `-${cqw(10.5)}`,
                    width: cqw(21),
                    height: cqw(40),
                    transformOrigin: 'bottom center',
                    background: 'linear-gradient(0deg, #ffb347, #fff3c4 80%)',
                }}
            />
            {[
                { ex: cqw(16), delay: '0s', left: `calc(50% - ${cqw(6)})` },
                { ex: `-${cqw(20)}`, delay: '1s', left: `calc(50% + ${cqw(4)})` },
                { ex: cqw(10), delay: '2s', left: '50%' },
            ].map((ember) => (
                <div
                    key={ember.left}
                    className="absolute rounded-full animate-campfire-ember-rise"
                    style={{
                        left: ember.left,
                        bottom: cqw(16),
                        width: cqw(4),
                        height: cqw(4),
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
                left: `calc(50% + ${cqw(layout.dx)})`,
                bottom: `calc(20% + ${cqw(layout.dy)})`,
                transform: `translateX(-50%) scale(${layout.scale})`,
                transformOrigin: 'bottom center',
                zIndex: layout.z,
            }}
            onMouseEnter={() => onHover(character.character_id)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(character)}
        >
            {hovered && (
                <div className="absolute left-1/2 -translate-x-1/2 bg-x-dark/95 border border-x-gold/40 text-x-gold-2 font-cinzel tracking-wider uppercase rounded whitespace-nowrap z-[5]"
                    style={{
                        top: `-${cqw(56)}`,
                        fontSize: cqw(12),
                        paddingLeft: cqw(20),
                        paddingRight: cqw(20),
                        paddingTop: cqw(6),
                        paddingBottom: cqw(6),
                    }}
                >
                    {t('account.characters.scene.selectTooltip')}
                </div>
            )}
            <div
                className="rounded-full flex items-center justify-center font-cinzel font-bold text-black"
                style={{
                    width: cqw(76),
                    height: cqw(76),
                    marginBottom: cqw(12),
                    fontSize: cqw(24),
                    background: `linear-gradient(160deg, ${color}, ${color}cc)`,
                }}
            >
                {character.level}
            </div>
            <div className="relative"
                style={{
                    width: cqw(108),
                    height: cqw(208),
                    filter: hovered ? `drop-shadow(0 0 ${cqw(20)} ${color})` : undefined,
                }}
            >
                <div className="rounded-full mx-auto" style={{ width: cqw(48), height: cqw(48), background: `${color}cc` }} />
                <div
                    className="mx-auto"
                    style={{
                        width: cqw(92),
                        height: cqw(128),
                        marginTop: cqw(8),
                        background: `linear-gradient(160deg, ${color}, ${color}88)`,
                        clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
                    }}
                />
            </div>
            <div className={`font-cinzel tracking-wide ${hovered ? 'text-x-gold-2' : 'text-gray-300'}`}
                style={{ marginTop: cqw(4), fontSize: cqw(24), textShadow: '0 0 8px rgba(0,0,0,0.9)' }}
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
            style={{
                aspectRatio: '1406 / 788',
                containerType: 'inline-size',
                backgroundImage: 'url(/campfire-scene-bg.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
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
