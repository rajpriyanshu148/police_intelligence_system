import React, { useState } from 'react'
import { Sparkles, Shield, BookOpen, AlertCircle, FileText, CheckCircle } from 'lucide-react'
import { PageTransition, Button, Badge, TextArea } from '@/design-system'
import { useAIHealth, useAnalyzeCase, useExtractEntities, useGenerateFIRDraft, useGenerateLegal, useReviewAI } from './hooks/useAI'
import styles from './AIAssistantPage.module.css'

interface AIAssistantPageProps {
  caseId: string
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({ caseId }) => {
  // Health
  const { data: health } = useAIHealth()
  const isOnline = health?.status === 'healthy'

  // Mutations
  const analyzeMutation = useAnalyzeCase(caseId)
  const extractMutation = useExtractEntities(caseId)
  const firMutation = useGenerateFIRDraft(caseId)
  const legalMutation = useGenerateLegal(caseId)
  const reviewMutation = useReviewAI(caseId)

  // Local state storage of resolved analysis results
  const [analysisRes, setAnalysisRes] = useState<any | null>(null)
  const [entitiesRes, setEntitiesRes] = useState<any[] | null>(null)
  const [firRes, setFirRes] = useState<any | null>(null)
  const [legalRes, setLegalRes] = useState<any | null>(null)

  // Textarea edit modes
  const [editAnalysisText, setEditAnalysisText] = useState('')
  const [isEditingAnalysis, setIsEditingAnalysis] = useState(false)

  const [editFirText, setEditFirText] = useState('')
  const [isEditingFir, setIsEditingFir] = useState(false)

  const [approvedSections, setApprovedSections] = useState<string[]>([])
  const [officerNotes, setOfficerNotes] = useState('')

  // Triggers
  const handleAnalyze = async () => {
    try {
      const res = await analyzeMutation.mutateAsync()
      setAnalysisRes(res)
      setEditAnalysisText(res.summary_draft)
    } catch {}
  }

  const handleExtract = async () => {
    try {
      const res = await extractMutation.mutateAsync()
      setEntitiesRes(res)
    } catch {}
  }

  const handleFIRDraft = async () => {
    try {
      const res = await firMutation.mutateAsync(officerNotes || undefined)
      setFirRes(res)
      setEditFirText(res.original_narrative_draft)
    } catch {}
  }

  const handleLegal = async () => {
    try {
      const res = await legalMutation.mutateAsync()
      setLegalRes(res)
      setApprovedSections((res.suggested_sections || []).map((s: any) => `${s.act_name}_${s.section_code}`))
    } catch {}
  }

  const handleReviewAnalysisSubmit = async (action: 'ACCEPT' | 'EDIT' | 'REJECT') => {
    if (!analysisRes) return
    try {
      await reviewMutation.mutateAsync({
        target_type: 'ANALYSIS',
        suggestion_id: analysisRes.id,
        action,
        edited_text: action === 'EDIT' ? editAnalysisText : undefined,
      })
      setAnalysisRes(null)
      setIsEditingAnalysis(false)
    } catch {}
  }

  const handleReviewFIRSubmit = async (action: 'ACCEPT' | 'EDIT' | 'REJECT') => {
    if (!firRes) return
    try {
      await reviewMutation.mutateAsync({
        target_type: 'FIR',
        suggestion_id: firRes.id,
        action,
        edited_text: action === 'EDIT' ? editFirText : undefined,
      })
      setFirRes(null)
      setIsEditingFir(false)
    } catch {}
  }

  const handleReviewLegalSubmit = async () => {
    if (!legalRes) return
    try {
      await reviewMutation.mutateAsync({
        target_type: 'LEGAL',
        suggestion_id: legalRes.id,
        action: approvedSections.length > 0 ? 'ACCEPT' : 'REJECT',
        approved_sections: approvedSections,
      })
      setLegalRes(null)
    } catch {}
  }

  const toggleSection = (id: string) => {
    setApprovedSections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <PageTransition className={styles.container}>
      <div className={styles.aiHeader}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>
          AIPAS Intelligence AI Co-Pilot
        </h2>
        <div className={styles.healthBadge}>
          <div className={styles.healthDot} style={{ backgroundColor: isOnline ? 'var(--success)' : 'var(--danger)' }} />
          <span>{isOnline ? 'AI Service Online' : 'AI Service Offline'}</span>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Card 1 — Complaint Analysis */}
        <div className={styles.aiCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><Sparkles size={20} /></div>
            <span className={styles.cardTitle}>AI Complaint Case Analyzer</span>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
            Analyzes the raw complaint text narrative to draft a case summary, suggest severity ratings, response priority, and pinpoint missing case information.
          </p>

          {!analysisRes ? (
            <Button onClick={handleAnalyze} loading={analyzeMutation.isPending} disabled={!isOnline}>
              Execute AI Analysis
            </Button>
          ) : (
            <div className={styles.resultArea}>
              <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)' }}>AI Summary Draft Suggestion</h4>
              
              {isEditingAnalysis ? (
                <TextArea
                  id="editAnalysis"
                  value={editAnalysisText}
                  onChange={(e) => setEditAnalysisText(e.target.value)}
                  rows={4}
                />
              ) : (
                <div className={styles.preBlock}>{analysisRes.summary_draft}</div>
              )}

              <div className={styles.metadataGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Suggested Category</span>
                  <span className={styles.metaValue}>{analysisRes.suggested_category}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Suggested Severity</span>
                  <span className={styles.metaValue}>{analysisRes.suggested_severity}</span>
                </div>
              </div>

              {analysisRes.missing_information?.length > 0 && (
                <div>
                  <h5 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: '6px' }}>Missing Investigation Info</h5>
                  <div className={styles.listGroup}>
                    {analysisRes.missing_information.map((info: string) => (
                      <div key={info} className={styles.listItem}>
                        <AlertCircle size={12} color="var(--warning)" />
                        <span>{info}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.reviewButtons}>
                {isEditingAnalysis ? (
                  <>
                    <Button variant="secondary" onClick={() => setIsEditingAnalysis(false)}>Cancel</Button>
                    <Button onClick={() => handleReviewAnalysisSubmit('EDIT')} loading={reviewMutation.isPending}>
                      Submit Edits
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="danger" onClick={() => handleReviewAnalysisSubmit('REJECT')} loading={reviewMutation.isPending}>
                      Reject
                    </Button>
                    <Button variant="secondary" onClick={() => setIsEditingAnalysis(true)}>
                      Edit Narrative
                    </Button>
                    <Button onClick={() => handleReviewAnalysisSubmit('ACCEPT')} loading={reviewMutation.isPending}>
                      Accept Suggestion
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card 2 — Entity Extraction */}
        <div className={styles.aiCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><FileText size={20} /></div>
            <span className={styles.cardTitle}>Named Entity Extractor</span>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
            Extracts suspect details, names, locations, date/time references, phone contacts, and vehicle profiles from file narratives.
          </p>

          {!entitiesRes ? (
            <Button onClick={handleExtract} loading={extractMutation.isPending} disabled={!isOnline}>
              Extract Case Entities
            </Button>
          ) : (
            <div className={styles.resultArea}>
              {entitiesRes.length === 0 ? (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>No structured entities identified in the narrative.</p>
              ) : (
                <table className={styles.entityTable}>
                  <thead>
                    <tr>
                      <th className={styles.entityTh}>Entity Name</th>
                      <th className={styles.entityTh}>Classification</th>
                      <th className={styles.entityTh}>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entitiesRes.map((ent, idx) => (
                      <tr key={idx}>
                        <td className={styles.entityTd} style={{ fontWeight: 'var(--weight-semibold)' }}>{ent.name}</td>
                        <td className={styles.entityTd}><Badge status="info">{ent.type}</Badge></td>
                        <td className={styles.entityTd}>{(ent.confidence * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Card 3 — FIR Narrative Draft */}
        <div className={styles.aiCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><Shield size={20} /></div>
            <span className={styles.cardTitle}>AI FIR Narrative Generator</span>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
            Drafts the official legal FIR narrative in standard police legal format based on case details and optional investigator notes.
          </p>

          {!firRes ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              <TextArea
                id="notes"
                placeholder="Optional investigator search logs, suspects, evidence lists to seed the FIR generator..."
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                rows={2}
              />
              <Button onClick={handleFIRDraft} loading={firMutation.isPending} disabled={!isOnline}>
                Draft FIR Narrative
              </Button>
            </div>
          ) : (
            <div className={styles.resultArea}>
              <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)' }}>AI Drafted FIR Narrative</h4>
              {isEditingFir ? (
                <TextArea
                  id="editFir"
                  value={editFirText}
                  onChange={(e) => setEditFirText(e.target.value)}
                  rows={6}
                />
              ) : (
                <div className={styles.preBlock}>{firRes.original_narrative_draft}</div>
              )}

              <div className={styles.reviewButtons}>
                {isEditingFir ? (
                  <>
                    <Button variant="secondary" onClick={() => setIsEditingFir(false)}>Cancel</Button>
                    <Button onClick={() => handleReviewFIRSubmit('EDIT')} loading={reviewMutation.isPending}>
                      Submit Edits
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="danger" onClick={() => handleReviewFIRSubmit('REJECT')} loading={reviewMutation.isPending}>
                      Reject Draft
                    </Button>
                    <Button variant="secondary" onClick={() => setIsEditingFir(true)}>
                      Edit Narrative
                    </Button>
                    <Button onClick={() => handleReviewFIRSubmit('ACCEPT')} loading={reviewMutation.isPending}>
                      Accept Draft
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card 4 — Legal Dictionary Recommendations */}
        <div className={styles.aiCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><BookOpen size={20} /></div>
            <span className={styles.cardTitle}>Legal Sections Assistant</span>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
            Matches incident description narratives against active legal codes and returns matching section codes, punishments, and definitions.
          </p>

          {!legalRes ? (
            <Button onClick={handleLegal} loading={legalMutation.isPending} disabled={!isOnline}>
              Analyze Legal Sections
            </Button>
          ) : (
            <div className={styles.resultArea}>
              <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', marginBottom: '8px' }}>Suggested Sections</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {legalRes.suggested_sections?.map((sec: any) => {
                  const secId = `${sec.act_name}_${sec.section_code}`
                  return (
                    <div
                      key={secId}
                      style={{
                        padding: '12px',
                        border: '1px solid var(--card-border)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--muted)',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={approvedSections.includes(secId)}
                        onChange={() => toggleSection(secId)}
                        style={{ marginTop: '3px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xs)' }}>
                            {sec.act_name} Section {sec.section_code}
                          </span>
                          <Badge status="info">{(sec.confidence * 100).toFixed(0)}% Match</Badge>
                        </div>
                        <div style={{ fontSize: 'var(--text-xxs)', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                          {sec.title}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--foreground)', marginTop: '6px', lineHeight: 1.4 }}>
                          {sec.description}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <Button onClick={handleReviewLegalSubmit} loading={reviewMutation.isPending}>
                  <CheckCircle size={16} style={{ marginRight: '8px' }} /> Submit Checked Sections
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
