import json

# Load the source JSON file
with open('data/answers.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

extracted = []
for item in data.get('data', []):
    for para in item.get('paragraphs', []):
        for qa in para.get('qas', []):
            question = qa.get('question')
            # Extract text from the answers list
            answers_text = [ans.get('text') for ans in qa.get('answers', [])]
            extracted.append({
                'question': question,
                'answers': answers_text
            })

# Save the extracted questions and answers to a new JSON file
output_filename = 'extracted_questions_answers.json'
with open(output_filename, 'w', encoding='utf-8') as f:
    json.dump(extracted, f, indent=4, ensure_ascii=False)

print(f"Successfully extracted {len(extracted)} questions and answers into {output_filename}.")