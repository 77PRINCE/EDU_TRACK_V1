
    
        (function() {
            const STORAGE_KEY = 'edutrack_pro_students_v2';
            let students = [];
            let editingId = null;
            let gradeChart = null;
            let currentDeleteId = null;

            // DOM refs
            const sidebar = document.getElementById('sidebar');
            const sidebarOverlay = document.getElementById('sidebarOverlay');
            const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const mainContent = document.getElementById('mainContent');
            const studentForm = document.getElementById('studentForm');
            const formTitle = document.getElementById('formTitle');
            const editIdInput = document.getElementById('editId');
            const studentNameInput = document.getElementById('studentName');
            const studentClassInput = document.getElementById('studentClass');
            const studentSubjectInput = document.getElementById('studentSubject');
            const caScoreInput = document.getElementById('caScore');
            const examScoreInput = document.getElementById('examScore');
            const submitBtn = document.getElementById('submitBtn');
            const cancelBtn = document.getElementById('cancelBtn');
            const searchInput = document.getElementById('searchInput');
            const tableBody = document.getElementById('tableBody');
            const toastContainer = document.getElementById('toastContainer');
            const modalRoot = document.getElementById('modalRoot');
            const headerDate = document.getElementById('headerDate');
            const headerClock = document.getElementById('headerClock');
            const chartContainer = document.getElementById('chartContainer');
            const noChartData = document.getElementById('noChartData');
            const gradeChartCanvas = document.getElementById('gradeChart');
            const chartLegend = document.getElementById('chartLegend');
            const centerTotal = document.getElementById('centerTotal');
            const doughnutCenter = document.getElementById('doughnutCenter');
            const errName = document.getElementById('errName');
            const errClass = document.getElementById('errClass');
            const errSubject = document.getElementById('errSubject');
            const errCA = document.getElementById('errCA');
            const errExam = document.getElementById('errExam');

            function calculateGrade(total) {
                if (total >= 70) return { grade: 'A', remarks: 'Excellent' };
                if (total >= 60) return { grade: 'B', remarks: 'Very Good' };
                if (total >= 50) return { grade: 'C', remarks: 'Good' };
                if (total >= 45) return { grade: 'D', remarks: 'Fair' };
                return { grade: 'F', remarks: 'Fail' };
            }

            function getGradeBadgeClass(grade) {
                const map = { A: 'grade-A', B: 'grade-B', C: 'grade-C', D: 'grade-D', F: 'grade-F' };
                return map[grade] || 'grade-F';
            }

            function loadFromStorage() {
                try { students = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { students = []; }
            }

            function saveToStorage() {
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(students)); } catch (e) { showToast('error',
                        '⚠️', 'Storage full.'); }
            }

            function showToast(type, icon, message, duration = 3800) {
                const toast = document.createElement('div');
                toast.className = `toast toast-${type}`;
                toast.innerHTML =
                    `<span class="toast-icon">${icon}</span><span class="toast-message">${message}</span><button class="toast-close">✕</button>`;
                toastContainer.appendChild(toast);
                const closeBtn = toast.querySelector('.toast-close');
                const remove = () => { if (toast.parentNode && !toast.classList.contains('removing')) { toast.classList
                            .add('removing');
                        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 350); } };
                closeBtn.addEventListener('click', remove);
                const timer = setTimeout(remove, duration);
                toast.addEventListener('mouseenter', () => clearTimeout(timer));
                toast.addEventListener('mouseleave', () => { const t = setTimeout(remove, 2000);
                    toast._t = t; });
            }

            function showDeleteModal(id, name) {
                currentDeleteId = id;
                const overlay = document.createElement('div');
                overlay.className = 'modal-overlay';
                overlay.id = 'deleteModal';
                overlay.innerHTML = `<div class="modal-dialog"><h4>⚠️ Confirm Delete</h4><p>Delete <strong>${escapeHTML(name)}</strong>?</p><div class="modal-btns"><button class="btn btn-delete" id="confirmDeleteBtn">🗑️ Delete</button><button class="btn btn-outline" id="cancelDeleteBtn">Cancel</button></div></div>`;
                modalRoot.appendChild(overlay);
                document.getElementById('confirmDeleteBtn').addEventListener('click', () => { closeDeleteModal();
                    performDelete(currentDeleteId); });
                document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
                overlay.addEventListener('click', e => { if (e.target === overlay) closeDeleteModal(); });
            }

            function closeDeleteModal() {
                const m = document.getElementById('deleteModal');
                if (m) { m.style.opacity = '0';
                    m.style.transition = 'opacity 0.2s';
                    setTimeout(() => m.remove(), 200); }
                currentDeleteId = null;
            }

            function performDelete(id) {
                const s = students.find(x => x.id === id);
                students = students.filter(x => x.id !== id);
                saveToStorage();
                if (editingId === id) resetForm();
                refreshAll();
                if (s) showToast('success', '🗑️', `Deleted ${escapeHTML(s.name)}.`);
            }

            function escapeHTML(s) { const d = document.createElement('div');
                d.textContent = s; return d.innerHTML; }

            function clearErrors() {
                [errName, errClass, errSubject, errCA, errExam].forEach(e => e.classList.remove('visible'));
                [studentNameInput, studentClassInput, studentSubjectInput, caScoreInput, examScoreInput].forEach(e => e
                    .classList.remove('error'));
            }

            function validateForm() {
                clearErrors();
                let ok = true;
                const name = studentNameInput.value.trim();
                const cls = studentClassInput.value;
                const subj = studentSubjectInput.value;
                const caR = caScoreInput.value.trim();
                const exR = examScoreInput.value.trim();
                if (!name) { errName.classList.add('visible');
                    studentNameInput.classList.add('error');
                    ok = false; }
                if (!cls) { errClass.classList.add('visible');
                    studentClassInput.classList.add('error');
                    ok = false; }
                if (!subj) { errSubject.classList.add('visible');
                    studentSubjectInput.classList.add('error');
                    ok = false; }
                if (caR === '') { errCA.textContent = 'Required.';
                    errCA.classList.add('visible');
                    caScoreInput.classList.add('error');
                    ok = false; } else { const ca = Number(caR); if (isNaN(ca) || !Number.isInteger(ca) || ca < 0 || ca >
                        30) { errCA.textContent = '0–30 only.';
                        errCA.classList.add('visible');
                        caScoreInput.classList.add('error');
                        ok = false; } }
                if (exR === '') { errExam.textContent = 'Required.';
                    errExam.classList.add('visible');
                    examScoreInput.classList.add('error');
                    ok = false; } else { const ex = Number(exR); if (isNaN(ex) || !Number.isInteger(ex) || ex < 0 || ex >
                        70) { errExam.textContent = '0–70 only.';
                        errExam.classList.add('visible');
                        examScoreInput.classList.add('error');
                        ok = false; } }
                return ok;
            }

            function resetForm() {
                studentForm.reset();
                editIdInput.value = '';
                editingId = null;
                formTitle.textContent = '📝 Add New Student';
                submitBtn.textContent = '💾 Save Record';
                cancelBtn.style.display = 'none';
                clearErrors();
                studentNameInput.focus();
            }

            function populateFormForEdit(s) {
                editingId = s.id;
                editIdInput.value = s.id;
                studentNameInput.value = s.name;
                studentClassInput.value = s.class;
                studentSubjectInput.value = s.subject;
                caScoreInput.value = s.caScore;
                examScoreInput.value = s.examScore;
                formTitle.textContent = '✏️ Edit Student Record';
                submitBtn.textContent = '📝 Update Record';
                cancelBtn.style.display = 'inline-flex';
                clearErrors();
                document.getElementById('studentFormCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
                studentNameInput.focus();
            }

            function handleSubmit(e) {
                e.preventDefault();
                if (!validateForm()) { showToast('error', '❌', 'Fix errors first.'); return; }
                const name = studentNameInput.value.trim();
                const cls = studentClassInput.value;
                const subject = studentSubjectInput.value;
                const ca = parseInt(caScoreInput.value, 10);
                const exam = parseInt(examScoreInput.value, 10);
                const total = ca + exam;
                const { grade, remarks } = calculateGrade(total);
                const data = {
                    id: editingId || Date.now().toString(),
                    name,
                    class: cls,
                    subject,
                    caScore: ca,
                    examScore: exam,
                    total,
                    grade,
                    remarks,
                    dateAdded: editingId ? (students.find(x => x.id === editingId)?.dateAdded || new Date()
                        .toISOString()) : new Date().toISOString()
                };
                if (editingId) {
                    const idx = students.findIndex(x => x.id === editingId);
                    if (idx !== -1) students[idx] = data;
                    showToast('success', '✅', `Updated ${escapeHTML(name)}.`);
                } else {
                    students.push(data);
                    showToast('success', '🎉', `Added ${escapeHTML(name)}!`);
                }
                saveToStorage();
                resetForm();
                refreshAll();
            }

            function handleCancel() { resetForm();
                showToast('info', 'ℹ️', 'Edit cancelled.'); }

            function renderTable(filter = '') {
                const term = filter.toLowerCase().trim();
                let list = term ? students.filter(s => s.name.toLowerCase().includes(term) || s.class.toLowerCase()
                    .includes(term) || s.subject.toLowerCase().includes(term) || s.grade.toLowerCase().includes(
                        term)) : students;
                if (list.length === 0) {
                    tableBody.innerHTML =
                        `<tr class="empty-row"><td colspan="10"><div class="empty-table"><span class="empty-icon">${term?'🔍':'📭'}</span>${term?'No matches.':'No records yet.'}</div></td></tr>`;
                    return;
                }
                tableBody.innerHTML = list.map((s, i) => {
                    const gc = getGradeBadgeClass(s.grade);
                    return `<tr><td>${i+1}</td><td><strong>${escapeHTML(s.name)}</strong></td><td>${escapeHTML(s.class)}</td><td>${escapeHTML(s.subject)}</td><td>${s.caScore}</td><td>${s.examScore}</td><td><strong>${s.total}</strong></td><td><span class="grade-badge ${gc}">${s.grade}</span></td><td>${escapeHTML(s.remarks)}</td><td><div class="actions-cell"><button class="btn btn-sm btn-edit" data-edit="${s.id}">✏️</button><button class="btn btn-sm btn-delete" data-delete="${s.id}">🗑️</button></div></td></tr>`;
                }).join('');
                tableBody.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => { const s =
                        students.find(x => x.id === b.dataset.edit); if (s) populateFormForEdit(s); }));
                tableBody.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => { const s =
                        students.find(x => x.id === b.dataset.delete); if (s) showDeleteModal(s.id, s.name); }));
            }

            function animateValue(elId, target, suffix = '', decimals = 0) {
                const el = document.getElementById(elId);
                if (!el) return;
                const cur = parseFloat(el.textContent.replace(/[^0-9.]/g, '')) || 0;
                const tgt = typeof target === 'number' ? target : parseFloat(target) || 0;
                if (cur === tgt && el.dataset.anim === String(tgt)) return;
                el.dataset.anim = String(tgt);
                const dur = 600,
                    start = performance.now();

                function step(ts) {
                    const p = Math.min((ts - start) / dur, 1);
                    const ease = 1 - Math.pow(1 - p, 3);
                    const v = cur + (tgt - cur) * ease;
                    el.textContent = decimals > 0 ? v.toFixed(decimals) + suffix : Math.round(v) + suffix;
                    if (p < 1) requestAnimationFrame(step);
                    else el.textContent = decimals > 0 ? tgt.toFixed(decimals) + suffix : Math.round(tgt) + suffix;
                }
                requestAnimationFrame(step);
            }

            function updateStats() {
                const tot = students.length;
                const fails = students.filter(s => s.grade === 'F').length;
                const pass = tot - fails;
                const rate = tot > 0 ? Math.round((pass / tot) * 100) : 0;
                const avg = tot > 0 ? (students.reduce((a, s) => a + s.total, 0) / tot).toFixed(1) : '0.0';
                animateValue('statTotal', tot);
                animateValue('statPassRate', rate, '%');
                animateValue('statFailures', fails);
                animateValue('statAverage', parseFloat(avg), '', 1);
            }

            function updateChart() {
                const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
                students.forEach(s => { if (counts.hasOwnProperty(s.grade)) counts[s.grade]++; });
                const tot = students.length;
                if (tot === 0) {
                    chartContainer.style.display = 'none';
                    doughnutCenter.style.display = 'none';
                    noChartData.style.display = 'block';
                    chartLegend.innerHTML = '';
                    if (gradeChart) { gradeChart.destroy();
                        gradeChart = null; }
                    return;
                }
                chartContainer.style.display = 'block';
                doughnutCenter.style.display = 'block';
                noChartData.style.display = 'none';
                centerTotal.textContent = tot;
                const labels = ['A (70–100)', 'B (60–69)', 'C (50–59)', 'D (45–49)', 'F (0–44)'];
                const data = [counts.A, counts.B, counts.C, counts.D, counts.F];
                const bgColors = ['#0b7a4a', '#1a4dbf', '#b45309', '#c2410c', '#c51a1a'];
                const borderColors = ['#05472d', '#152c6b', '#5c2d0a', '#5e1a08', '#5c1010'];
                const grades = ['A', 'B', 'C', 'D', 'F'];
                const dotClasses = ['dot-A', 'dot-B', 'dot-C', 'dot-D', 'dot-F'];
                chartLegend.innerHTML = grades.map((g, i) => {
                    const pct = tot > 0 ? ((counts[g] / tot) * 100).toFixed(1) : '0.0';
                    return `<div class="legend-item"><span class="legend-dot ${dotClasses[i]}"></span>${labels[i]}<span class="legend-percent">${pct}%</span></div>`;
                }).join('');

                if (gradeChart) {
                    gradeChart.data.datasets[0].data = data;
                    gradeChart.update('active');
                } else {
                    gradeChart = new Chart(gradeChartCanvas, {
                        type: 'doughnut',
                        data: {
                            labels,
                            datasets: [{ data, backgroundColor: bgColors, borderColor: borderColors,
                                borderWidth: 3, hoverBorderWidth: 5, hoverBorderColor: '#fff',
                                borderRadius: 2 }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            cutout: '68%',
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: '#040f1f',
                                    titleFont: { family: 'Poppins', weight: '700' },
                                    bodyFont: { family: 'Poppins', weight: '600' },
                                    padding: 14,
                                    cornerRadius: 8,
                                    callbacks: {
                                        label: ctx => { const v = ctx.parsed; const p = tot > 0 ? ((v / tot) *
                                                100).toFixed(1) : 0; return ` ${v} student(s) — ${p}%`; }
                                    }
                                }
                            },
                            animation: { animateScale: true, animateRotate: true, duration: 800 }
                        }
                    });
                }
            }

            function refreshAll() {
                renderTable(searchInput.value);
                updateStats();
                updateChart();
            }

            function isMobile() { return window.innerWidth <= 768; }

            function closeMobileSidebar() { sidebar.classList.remove('mobile-open');
                sidebarOverlay.classList.remove('active'); }

            function openMobileSidebar() { sidebar.classList.add('mobile-open');
                sidebarOverlay.classList.add('active'); }

            function toggleDesktopSidebar() { sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('expanded');
                setTimeout(() => { if (gradeChart) gradeChart.resize(); }, 350); }
            sidebarToggleBtn.addEventListener('click', () => { isMobile() ? closeMobileSidebar() :
            toggleDesktopSidebar(); });
            mobileMenuBtn.addEventListener('click', () => { sidebar.classList.contains('mobile-open') ?
                closeMobileSidebar() : openMobileSidebar(); });
            sidebarOverlay.addEventListener('click', closeMobileSidebar);
            document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', () => {
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                item.classList.add('active');
                const sec = item.dataset.section;
                const map = { form: 'studentFormCard', records: 'recordsSection', analytics: 'analyticsSection' };
                if (map[sec]) document.getElementById(map[sec]).scrollIntoView({ behavior: 'smooth',
                    block: 'start' });
                else window.scrollTo({ top: 0, behavior: 'smooth' });
                if (isMobile()) closeMobileSidebar();
            }));
            window.addEventListener('resize', () => { if (!isMobile()) closeMobileSidebar(); if (gradeChart) gradeChart
                    .resize(); });

            function updateClock() {
                const now = new Date();
                headerDate.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric',
                    month: 'long', day: 'numeric' });
                headerClock.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit',
                    second: '2-digit', hour12: true });
            }
            updateClock();
            setInterval(updateClock, 1000);
            searchInput.addEventListener('input', () => renderTable(searchInput.value));
            studentForm.addEventListener('submit', handleSubmit);
            cancelBtn.addEventListener('click', handleCancel);
            [studentNameInput, studentClassInput, studentSubjectInput, caScoreInput, examScoreInput].forEach(el => {
                el.addEventListener('input', () => { el.classList.remove('error'); });
                el.addEventListener('change', () => { el.classList.remove('error'); });
            });
            document.addEventListener('keydown', e => {
                if (e.key === 'Escape') { closeDeleteModal(); if (editingId) { resetForm();
                        showToast('info', 'ℹ️', 'Cancelled.'); } if (isMobile()) closeMobileSidebar(); }
                if (e.ctrlKey && e.shiftKey && e.key === 'N') { e.preventDefault();
                    resetForm();
                    document.getElementById('studentFormCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
                    studentNameInput.focus();
                    showToast('info', '💡', 'Ready for new entry.'); }
            });

            function init() {
                loadFromStorage();
                refreshAll();
                resetForm();
                if (isMobile()) { closeMobileSidebar();
                    sidebar.classList.remove('collapsed');
                    mainContent.classList.remove('expanded'); }
                console.log('🚀 EduTrack Pro ready — High Contrast Layout');
            }
            init();
        })();
    