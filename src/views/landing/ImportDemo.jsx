import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ListChecks, XCircle } from 'lucide-react'
import { parseCsv, validateImport } from '@/utils/studentImport'
import { IMPORT_SAMPLE_CSV, IMPORT_SAMPLE_DEPARTMENTS } from './sampleData'

// Runs the app's real import rules on a small sample spreadsheet.
export default function ImportDemo() {
  const [checked, setChecked] = useState(false)
  const result = useMemo(
    () => validateImport({ rows: parseCsv(IMPORT_SAMPLE_CSV), users: [], allowedDepartments: IMPORT_SAMPLE_DEPARTMENTS }),
    []
  )
  const ready = result.rows.filter((r) => r.student).length

  return (
    <div className="rounded-2xl border border-rule bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3 sm:px-5">
        <div>
          <p className="font-display text-base font-semibold text-ink">students-sem3.csv</p>
          <p className="text-xs text-ink-soft">Sample file with six rows and a few typical mistakes.</p>
        </div>
        <button
          type="button"
          onClick={() => setChecked((c) => !c)}
          className={
            checked
              ? 'rounded-lg border border-rule px-3.5 py-2 text-sm font-bold text-ink hover:bg-paper cursor-pointer'
              : 'inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-bold text-white hover:bg-brand-600 cursor-pointer'
          }
        >
          {!checked && <ListChecks className="h-4 w-4" aria-hidden="true" />}
          {checked ? 'Clear check' : 'Check rows'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-[11px] text-ink-soft">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium sm:px-5">Row</th>
              <th scope="col" className="px-2 py-2 font-medium">USN</th>
              <th scope="col" className="px-2 py-2 font-medium">Name</th>
              <th scope="col" className="px-2 py-2 font-medium">Sem</th>
              <th scope="col" className="px-2 py-2 font-medium">Dept</th>
              <th scope="col" className="px-4 py-2 font-medium sm:px-5">Result</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((r, i) => (
              <tr key={r.line} className="border-t border-rule/70 align-top">
                <td className="px-4 py-2 text-ink-soft tabular-nums sm:px-5">{r.line}</td>
                <td className="px-2 py-2 font-medium text-ink tabular-nums">{r.values.usn}</td>
                <td className="px-2 py-2 text-ink">{r.values.name}</td>
                <td className="px-2 py-2 text-ink tabular-nums">{r.values.semester}</td>
                <td className="px-2 py-2 text-ink">{r.values.department}</td>
                <td className="px-4 py-2 sm:px-5">
                  <AnimatePresence mode="wait" initial={false}>
                    {checked ? (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.15 }}
                      >
                        {r.student ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-present-strong">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-start gap-1 text-xs font-semibold text-absent-strong">
                            <XCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {r.errors[0]}
                          </span>
                        )}
                      </motion.div>
                    ) : (
                      <motion.span key="pending" className="text-xs text-ink-soft" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        Not checked
                      </motion.span>
                    )}
                  </AnimatePresence>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="border-t border-rule bg-paper px-4 py-2.5 text-xs text-ink-soft sm:px-5" aria-live="polite">
        {checked
          ? `${ready} rows ready to import, ${result.rows.length - ready} need fixing. Nothing is saved until you confirm.`
          : 'Rows are checked for USN format, semester, department, duplicates and email before anything is saved.'}
      </p>
    </div>
  )
}
