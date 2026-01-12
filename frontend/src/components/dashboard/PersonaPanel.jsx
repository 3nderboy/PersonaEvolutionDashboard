import React from 'react';

// Persona Panel Component
// Persona Timeline Visualization
const PersonaTimeline = ({ personas, selectedPersona }) => {
  const timeWindows = ["2025-01", "2025-07"];

  // Helper function to get cluster ID safely
  const getClusterId = (persona, index) => {
    // Assumes representativeClusterIds array is ordered [Jan, Jul]
    return persona.representativeClusterIds[index] || null;
  };

  return (
    <div className="flex flex-col gap-3 text-[11px]">
      {/* Time Labels: */}
      <div className="flex justify-between text-slate-400 font-mono text-xs font-semibold px-1 ml-10 mr-24">
        {/* Adjusted margins to align with the start/end markers: */}
        <span>{timeWindows[0]} (Jan)</span>
        <span>{timeWindows[1]} (Jul)</span>
      </div>
      
      {/* Visualization: */}
      <div className="flex flex-col gap-4">
      {personas.map((persona) => {
        const isSelected = persona.id === selectedPersona.id;
        const janClusterId = getClusterId(persona, 0);
        const julClusterId = getClusterId(persona, 1);
        const existsInJan = !!janClusterId;
        const existsInJul = !!julClusterId;

        return (
          <div key={persona.id} className="relative flex items-center h-8">
              {/* 1. Persona Label (Circle): */}
              <div 
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-20 shadow-xl
                      ${isSelected ? 'bg-sky-500 text-slate-900 ring-2 ring-sky-300' : 'bg-slate-700 text-slate-300'}`
                  }
                  title={persona.name}
              >
                  {persona.id.charAt(0)}
              </div>

              {/* 2. Central Track (Line) - Starts after circle, ends before name: */}
              <div className="absolute left-10 right-24 h-1 bg-slate-800 rounded-full transition duration-300 z-10">
                  
                  {/* Connection Line (Overlay on Track) - Only if it exists in both: */}
                  {existsInJan && existsInJul && (
                      <div className={`absolute inset-0 h-full rounded-full ${isSelected ? 'bg-sky-400' : 'bg-slate-400'}`}></div>
                  )}

                  {/* Individual Time Markers (Dots): */}
                  {timeWindows.map((tw, index) => {
                      const clusterId = getClusterId(persona, index);
                      const isActive = !!clusterId;
                      const positionClass = index === 0 ? 'left-0' : 'right-0';
                      
                      // Show a dashed placeholder if the persona doesn't exist in that period
                      if (!isActive) {
                          return (
                            <div 
                                key={tw}
                                className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-dashed rounded-full z-0 
                                    ${positionClass} ${isSelected ? 'border-sky-700/50' : 'border-slate-700/50'} 
                                    ${index === 0 ? '-translate-x-1/2' : 'translate-x-1/2'}`
                                }
                                title={`Not active in ${tw}`}
                            />
                          );
                      }

                      // Active marker
                      return (
                          <div
                              key={tw}
                              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all duration-300 shadow-xl z-20
                                  ${isSelected ? 'bg-sky-500 ring-4 ring-offset-2 ring-offset-slate-900 ring-sky-300' : 'bg-slate-400 ring-2 ring-slate-600'}
                                  ${positionClass}
                                  ${index === 0 ? '-translate-x-1/2' : 'translate-x-1/2'} `
                              }
                              title={`Cluster ${clusterId} in ${tw}`}
                          />
                      );
                  })}
              </div>
              
              {/* 3. Persona Name on the right: */}
              <span className={`absolute right-0 text-xs truncate w-20 text-right ${isSelected ? 'text-sky-300 font-medium' : 'text-slate-400'}`}>
                  {persona.name.split(',')[0]}
              </span>
          </div>
        );
      })}
      </div>

      <p className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-900">
        Solid line = a stable/drifting persona. <br />
        Single solid marker = an emerging/disappearing persona.
      </p>
    </div>
  );
};


// Persona Selector
const PersonaSelector = ({ personas, selectedPersona, onSelectPersona }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {personas.map((persona) => (
        <button
          key={persona.id}
          onClick={() => onSelectPersona(persona.id)}
          className={`flex-1 text-xs px-3 py-2 rounded-xl border transition duration-200 truncate font-medium shadow-md
            ${
              persona.id === selectedPersona.id
                ? "border-sky-500 bg-sky-600/30 text-sky-100"
                : "border-slate-800 bg-slate-800/70 text-slate-300 hover:border-slate-600"
            }`}
        >
          {/* Only displays the first name: */}
          {persona.name.split(',')[0]}
        </button>
      ))}
    </div>
  );
};


// Persona Details
const PersonaDetails = ({ persona }) => {
  // Logic to determine status color and label
  const statusConfig = {
    stable: {
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      label: "Stable",
    },
    drifting: {
      color: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      label: "Drifting",
    },
    split: {
      color: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      label: "Split / Emerging",
    },
  };

  const { color: statusColor, label: statusLabel } = statusConfig[persona.status];

  return (
    <div className="text-sm space-y-4">
      {/* Header and Status: */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xl font-bold text-sky-200">{persona.name}</div>
          <div className="text-xs text-slate-400 mt-1">
            Active in: <span className="font-mono">{persona.timeWindows.join(", ")}</span>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap ml-4 ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Description: */}
      <p className="text-slate-300 italic">{persona.description}</p>

      {/* Representative Clusters: */}
      <div className="border-t border-slate-700 pt-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
          Representative Clusters
        </div>
        <div className="flex flex-wrap gap-2">
          {persona.representativeClusterIds.map((cid) => (
            cid && <span
              key={cid}
              className="px-3 py-1 rounded-full bg-slate-800 border border-sky-600/30 text-sm font-mono text-sky-300 shadow-inner"
            >
              {cid}
            </span>
          ))}
        </div>
      </div>

      {/* Footer: */}
      <p className="text-[10px] text-slate-500 border-t border-slate-900 pt-3 mt-4">
        {/* Currently nothing */}
      </p>
    </div>
  );
};


// Persona Panel
const PersonaPanel = ({ personas, selectedPersona, onSelectPersona }) => {
  return (
    <section className="col-span-1 flex flex-col gap-4">
      <div className="h-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
        <h2 className="text-lg font-bold text-sky-300 mb-4">Persona Evolution</h2>
        <PersonaTimeline personas={personas} selectedPersona={selectedPersona} />
      </div>

      <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 overflow-auto shadow-lg">
        <h2 className="text-lg font-bold text-sky-300 mb-3">Persona Details</h2>
        <PersonaSelector
          personas={personas}
          selectedPersona={selectedPersona}
          onSelectPersona={onSelectPersona}
        />
        <PersonaDetails persona={selectedPersona} />
      </div>
    </section>
  );
};

export default PersonaPanel;