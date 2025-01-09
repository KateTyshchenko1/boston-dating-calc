import React, { useState } from 'react'
import { Range } from 'react-range'
import './index.css'

function DualRangeSlider({ label, values, onChange, min, max, step = 1, formatValue }) {
  return (
    <div className="filter-group">
      <label>{label}</label>
      <div className="range-row">
        <Range
          values={values}
          step={step}
          min={min}
          max={max}
          onChange={(vals) => onChange(vals)}
          renderTrack={({ props, children }) => (
            <div {...props} className="range-rail" style={props.style}>
              <div
                className="range-track"
                style={{
                  left: `${((Math.min(values[0], values[1]) - min) / (max - min)) * 100}%`,
                  width: `${(Math.abs(values[1] - values[0]) / (max - min)) * 100}%`,
                }}
              />
              {children}
            </div>
          )}
          renderThumb={({ props }) => (
            <div {...props} className="range-thumb" />
          )}
        />
      </div>
      <div className="value-display">
        {formatValue ? formatValue(values) : `${values[0]} - ${values[1]}`}
      </div>
    </div>
  )
}

function SingleRangeSlider({ label, value, onChange, min, max, step = 1, formatValue }) {
  return (
    <div className="filter-group">
      <label>{label}</label>
      <div className="range-row">
        <Range
          values={[value]}
          step={step}
          min={min}
          max={max}
          onChange={(vals) => onChange(vals[0])}
          renderTrack={({ props, children }) => (
            <div {...props} className="range-rail" style={props.style}>
              <div
                className="range-track"
                style={{
                  width: `${((value - min) / (max - min)) * 100}%`,
                }}
              />
              {children}
            </div>
          )}
          renderThumb={({ props }) => (
            <div {...props} className="range-thumb" />
          )}
        />
      </div>
      <div className="value-display">
        {formatValue ? formatValue(value) : value}
      </div>
    </div>
  )
}

export default function App() {
  const [preferences, setPreferences] = useState({
    gender: 'Men',
    ageRange: [22, 42],
    heightRange: [64, 66],
    minIncome: 50000,
    education: '',
    ethnicity: '',
    eyeColor: '',
    religion: '',
    smokes: 'No',
    drinks: 'Either',
    drugs: 'Either',
    excludeMarried: true,
    excludeObese: true
  })

  const [result, setResult] = useState(null)
  const BOSTON_POPULATION = 653833

  const formatHeight = (inches) => {
    const ft = Math.floor(inches / 12)
    const r = inches % 12
    return `${ft}'${r}"`
  }

  const calculateMatch = () => {
    let probability = 100
    probability *= preferences.gender === 'Women' ? 0.519 : 0.481
    const ageRangeWidth = Math.abs(preferences.ageRange[1] - preferences.ageRange[0])
    probability *= Math.min(ageRangeWidth / 62, 1)

    const hRange = Math.abs(preferences.heightRange[1] - preferences.heightRange[0])
    probability *= Math.min(hRange / (4 * 2.7), 1)

    if (preferences.ethnicity && preferences.ethnicity !== 'any') {
      const eStats = {
        white: 0.478,
        black: 0.215,
        asian: 0.1,
        hispanic: 0.189,
        native: 0.003,
        pacific: 0.001
      }
      probability *= eStats[preferences.ethnicity] || 0.01
    }

    if (preferences.minIncome >= 150000) probability *= 0.15
    else if (preferences.minIncome >= 100000) probability *= 0.35
    else if (preferences.minIncome >= 50000) probability *= 0.65

    if (preferences.education && preferences.education !== 'any') {
      const eduStats = {
        high_school: 0.889,
        some_college: 0.64,
        bachelors: 0.541,
        masters: 0.24,
        doctorate: 0.05
      }
      probability *= eduStats[preferences.education] || 0.15
    }

    if (preferences.religion) {
      const rStats = {
        non_religious: 0.36,
        catholic: 0.45,
        baptist: 0.02,
        muslim: 0.02,
        eastern: 0.03
      }
      probability *= rStats[preferences.religion] || 1
    }

    if (preferences.eyeColor && preferences.eyeColor !== 'any') {
      const eyeStats = {
        brown: 0.45,
        blue: 0.27,
        hazel: 0.18,
        green: 0.09
      }
      probability *= eyeStats[preferences.eyeColor] || 0.01
    }

    if (preferences.smokes === 'No') {
      probability *= preferences.gender === 'Men' ? 0.88 : 0.9
    } else if (preferences.smokes === 'Yes') {
      probability *= preferences.gender === 'Men' ? 0.12 : 0.1
    }

    if (preferences.drinks === 'Yes') {
      probability *= preferences.gender === 'Men' ? 0.56 : 0.48
    } else if (preferences.drinks === 'No') {
      probability *= preferences.gender === 'Men' ? 0.44 : 0.52
    }

    if (preferences.drugs === 'Yes') {
      probability *= preferences.gender === 'Men' ? 0.125 : 0.08
    } else if (preferences.drugs === 'No') {
      probability *= preferences.gender === 'Men' ? 0.875 : 0.92
    }

    if (preferences.excludeMarried) probability *= 0.65

    // Now ~22% obesity => multiply by 0.78 if exclude
    if (preferences.excludeObese) probability *= 0.78

    const matchingPeople = Math.round(BOSTON_POPULATION * (probability / 100))
    const finalProb = Math.max(0, Math.min(probability, 100)).toFixed(5)

    setResult({ percentage: finalProb, people: matchingPeople.toLocaleString() })
  }

  return (
    <div className="container">
      <h1 className="title">Find your match in Boston</h1>
      <p className="subtitle">Let's find out who's available</p>

      <div className="card">
        <div className="filter-group">
          <label>Gender</label>
          <div className="button-group">
            {['Men', 'Women'].map((g) => (
              <button
                key={g}
                className={`button ${preferences.gender === g ? 'active' : ''}`}
                onClick={() => setPreferences({ ...preferences, gender: g })}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <DualRangeSlider
          label="Age"
          values={preferences.ageRange}
          onChange={(vals) => setPreferences({ ...preferences, ageRange: vals })}
          min={18}
          max={80}
          step={1}
          formatValue={([a, b]) => `${a} - ${b}`}
        />

        <DualRangeSlider
          label="Height"
          values={preferences.heightRange}
          onChange={(vals) => setPreferences({ ...preferences, heightRange: vals })}
          min={60}
          max={84}
          step={1}
          formatValue={([a, b]) => `${formatHeight(a)} - ${formatHeight(b)}`}
        />

        <SingleRangeSlider
          label="Minimum Income"
          value={preferences.minIncome}
          onChange={(val) => setPreferences({ ...preferences, minIncome: val })}
          min={0}
          max={300000}
          step={5000}
          formatValue={(v) => `$${v.toLocaleString()}`}
        />

        <div className="filter-group">
          <label>Ethnicity</label>
          <select
            className="select"
            value={preferences.ethnicity}
            onChange={(e) => setPreferences({ ...preferences, ethnicity: e.target.value })}
          >
            <option value="">Select Ethnicity</option>
            <option value="any">Any</option>
            <option value="white">White</option>
            <option value="black">Black</option>
            <option value="asian">Asian</option>
            <option value="hispanic">Hispanic or Latino</option>
            <option value="native">American Indian</option>
            <option value="pacific">Pacific Islander</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Education</label>
          <select
            className="select"
            value={preferences.education}
            onChange={(e) => setPreferences({ ...preferences, education: e.target.value })}
          >
            <option value="">Select Education</option>
            <option value="any">Any</option>
            <option value="high_school">High School Graduate</option>
            <option value="some_college">Some College</option>
            <option value="bachelors">Bachelor's Degree</option>
            <option value="masters">Master's Degree</option>
            <option value="doctorate">Doctorate</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Eye Color</label>
          <select
            className="select"
            value={preferences.eyeColor}
            onChange={(e) => setPreferences({ ...preferences, eyeColor: e.target.value })}
          >
            <option value="">Select Eye Color</option>
            <option value="any">Any</option>
            <option value="brown">Brown</option>
            <option value="blue">Blue</option>
            <option value="hazel">Hazel</option>
            <option value="green">Green</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Religion</label>
          <select
            className="select"
            value={preferences.religion}
            onChange={(e) => setPreferences({ ...preferences, religion: e.target.value })}
          >
            <option value="">Select Religion</option>
            <option value="non_religious">Non-Religious</option>
            <option value="catholic">Catholic</option>
            <option value="baptist">Baptist</option>
            <option value="muslim">Muslim</option>
            <option value="eastern">Eastern Faiths</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Smokes</label>
          <div className="button-group">
            {['Either', 'Yes', 'No'].map((opt) => (
              <button
                key={opt}
                className={`button ${preferences.smokes === opt ? 'active' : ''}`}
                onClick={() => setPreferences({ ...preferences, smokes: opt })}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Drinks</label>
          <div className="button-group">
            {['Either', 'Yes', 'No'].map((opt) => (
              <button
                key={opt}
                className={`button ${preferences.drinks === opt ? 'active' : ''}`}
                onClick={() => setPreferences({ ...preferences, drinks: opt })}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Drugs</label>
          <div className="button-group">
            {['Either', 'Yes', 'No'].map((opt) => (
              <button
                key={opt}
                className={`button ${preferences.drugs === opt ? 'active' : ''}`}
                onClick={() => setPreferences({ ...preferences, drugs: opt })}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {[
          ['Exclude Married', 'excludeMarried'],
          ['Exclude Obese', 'excludeObese']
        ].map(([lbl, prefKey]) => (
          <div key={prefKey} className="filter-group">
            <label>{lbl}</label>
            <div className="button-group">
              {['Yes', 'No'].map((option) => (
                <button
                  key={option}
                  className={`button ${preferences[prefKey] === (option === 'Yes') ? 'active' : ''}`}
                  onClick={() => setPreferences({ ...preferences, [prefKey]: option === 'Yes' })}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button className="calculate-button" onClick={calculateMatch}>
          Let's Find Out
        </button>

        {result && (
          <div className="result">
            <h2 className="result-value">{result.percentage}%</h2>
            <p className="result-text">
              {result.people} people in Boston match your preferences
            </p>
          </div>
        )}
      </div>

      <div className="footer">
        Calculated with US Census Bureau data (2023) and approximate assumptions
      </div>
    </div>
  )
}
