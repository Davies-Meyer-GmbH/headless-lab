// Reusable quiz and recall widgets for the Drupal AI lessons.
//
// Multiple choice:
//   <div class="quiz" data-answer="2" data-explain="Why the answer is right.">
//     <p class="q">Question</p>
//     <button>Option</button> <button>Option</button> ...
//   </div>
//   data-answer is the 0-based index of the correct button.
//
// Recall (free text, then compare with a model answer):
//   <div class="recall"><p class="q">Prompt</p><template>Model answer</template></div>
//
// A <p class="score"></p> anywhere on the page shows the running score.

(function () {
  const style = document.createElement('style');
  style.textContent = `
    .quiz, .recall { font-family: var(--sans); margin: 0 0 18px; padding: 16px 18px; background: #fff; border: 1px solid var(--rule); border-radius: 8px; }
    .quiz .q, .recall .q { font-family: var(--serif); font-size: 1.02rem; margin: 0 0 12px; }
    .quiz .opts { display: flex; flex-wrap: wrap; gap: 10px; }
    .quiz button, .recall button { font: inherit; font-size: 0.92rem; padding: 8px 14px; border-radius: 6px; border: 1.5px solid var(--rule); background: var(--paper); color: var(--ink); cursor: pointer; }
    .quiz button:hover:not(:disabled) { border-color: var(--drop); }
    .quiz button:disabled { cursor: default; }
    .quiz button.right { border-color: var(--plan); background: #e3f0e8; }
    .quiz button.wrong { border-color: var(--wrong); background: #f6e3e3; }
    .quiz .fb, .recall .model { font-size: 0.9rem; line-height: 1.45; margin: 12px 0 0; }
    .quiz .fb.right { color: var(--plan); }
    .quiz .fb.wrong { color: var(--wrong); }
    .recall textarea { width: 100%; min-height: 84px; font: inherit; font-size: 0.95rem; padding: 10px; border: 1.5px solid var(--rule); border-radius: 6px; margin-bottom: 10px; background: var(--paper); color: var(--ink); }
    .recall .model { border-left: 3px solid var(--drop); padding-left: 12px; }
    .score { font-family: var(--sans); font-weight: 700; }
  `;
  document.head.appendChild(style);

  const quizzes = [...document.querySelectorAll('.quiz')];
  let answered = 0;
  let right = 0;
  const score = document.querySelector('.score');
  const showScore = () => {
    if (score) score.textContent = `${right} of ${quizzes.length} right` + (answered < quizzes.length ? `, ${quizzes.length - answered} to go` : '');
  };

  quizzes.forEach((quiz) => {
    const buttons = [...quiz.querySelectorAll('button')];
    const wrap = document.createElement('div');
    wrap.className = 'opts';
    buttons[0].before(wrap);
    buttons.forEach((b) => { b.type = 'button'; wrap.appendChild(b); });
    const fb = document.createElement('p');
    fb.className = 'fb';
    fb.setAttribute('aria-live', 'polite');
    quiz.appendChild(fb);
    const answer = Number(quiz.dataset.answer);
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => {
        const ok = index === answer;
        buttons.forEach((b) => { b.disabled = true; });
        button.classList.add(ok ? 'right' : 'wrong');
        if (!ok) buttons[answer].classList.add('right');
        fb.className = 'fb ' + (ok ? 'right' : 'wrong');
        fb.textContent = (ok ? 'Right. ' : 'Not quite. ') + (quiz.dataset.explain || '');
        answered += 1;
        if (ok) right += 1;
        showScore();
      });
    });
  });
  showScore();

  document.querySelectorAll('.recall').forEach((recall) => {
    const template = recall.querySelector('template');
    const area = document.createElement('textarea');
    area.setAttribute('aria-label', 'Your answer');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Compare with the model answer';
    const model = document.createElement('p');
    model.className = 'model';
    model.hidden = true;
    model.innerHTML = template.innerHTML;
    recall.append(area, button, model);
    button.addEventListener('click', () => { model.hidden = false; button.disabled = true; });
  });
})();
