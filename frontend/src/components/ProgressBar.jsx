import React from 'react';

function ProgressBar({ totali, obiettivi }) {
  const percentCal = Math.min((totali.calorie / obiettivi.calorie) * 100, 100) || 0;

  return (
    <div className="glass-panel progress-container animate-fade-in">
      <div className="progress-header">
        <span>Calorie Giornaliere</span>
        <span>{Math.round(totali.calorie)} / {obiettivi.calorie} kcal</span>
      </div>
      <div className="progress-bar-bg">
        <div className="progress-bar-fill" style={{ width: `${percentCal}%` }}></div>
      </div>
      
      <div className="macros-summary">
        <div className="macro-item">
          <div className="macro-label">Proteine</div>
          <div className="macro-value pro-color">{Math.round(totali.proteine)}g</div>
          <div className="macro-label" style={{fontSize: '0.75rem', marginTop: '0.25rem'}}>su {obiettivi.proteine}g</div>
        </div>
        <div className="macro-item">
          <div className="macro-label">Carboidrati</div>
          <div className="macro-value car-color">{Math.round(totali.carboidrati)}g</div>
          <div className="macro-label" style={{fontSize: '0.75rem', marginTop: '0.25rem'}}>su {obiettivi.carboidrati}g</div>
        </div>
        <div className="macro-item">
          <div className="macro-label">Grassi</div>
          <div className="macro-value gra-color">{Math.round(totali.grassi)}g</div>
          <div className="macro-label" style={{fontSize: '0.75rem', marginTop: '0.25rem'}}>su {obiettivi.grassi}g</div>
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;
