from flask import Flask, render_template, request, jsonify
import os
import re
import json

from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain
from langchain_community.chat_models import ChatOpenAI
from langchain_community.vectorstores import Chroma


app = Flask(__name__)


KEY = ''
os.environ["OPENAI_API_KEY"] = KEY


# read the index file of the indicators
f_ip = open('./indicators.txt', encoding='utf-8')
check_labels = {}
for line in f_ip:
    sent = line.split('\t')[1].strip()
    check_labels[sent] = line.split('\t')[3].strip()
f_ip.close()

check_label2id = {'Right': -1, 'Left': 1, 'Center': 0}

# the prompt for descriptor generation
gen_template = """
    The definition of bias indicator here is a concise, descriptive label or tag to represent the presence or nature of media bias.

    Human analyze bias indicator from 5 bias indicator categories: Tone and Language, Sources and Citations, Coverage and Balance, Agenda and Framing, Examples and Analogies.

    Give the TEXT INPUT {text}

    Could you summarize the bias indicator from the given five categories and list the bias indicator to identify the political leaning (left, right and Neutral)?

    ----here are some output examples-----

    Focuses on crimes committed by undocumented immigrants who were eligible for Obama's DACA amnesty program - Right Leaning
    Criticizes Trump's claim that immigrants cause crime rates to rise - Left Leaning
    mentions the possibility of Trump firing Deputy Attorney General Rod Rosenstein but states that there have been no discussions about it. - Neutral
    -----------------------------
    Please reply bias indicator in the following form strictly.
    caetgory - generated bias indicator (less than 30 words) - political leaning

    """

# the prompt for mapping
map_template = """
    The descriptors are the key points that may reflect the media bias of an article.

    And the descriptors is considered from 5 bias indicator categories: Tone and Language, Sources and Citations, Coverage and Balance, Agenda and Framing, Examples and Analogies.

    Give the TEXT INPUT {text}

    and a DESCRIPTOR {dep}
    
    Could you point out the phrases or sentences that reflect this descriptor? Please answer in the format [], [], []

    """



# Function tp get the descriptors of the input text
def get_destriptor(processed_text,key):
    os.environ["OPENAI_API_KEY"] = key
    llm = ChatOpenAI(model_name='gpt-3.5-turbo-16k')
    prompt = ChatPromptTemplate.from_template(gen_template)
    chain = LLMChain(llm=llm, prompt=prompt)
    answer = chain.run(processed_text)
    destriptors = re.findall(r'(.*?) - (.*?) - (.*?)\n', answer) + re.findall(r'(.*?) - (.*?) - (.*?)$', answer)
    if len(destriptors) == 0:
        print('No destriptors for this article, please try for another.')
        print(answer)
    return destriptors




# Function to process the article and return indicators with scores
def process_article(article, key):
    print('Processing the article...')
    processed_text = article
    os.environ["OPENAI_API_KEY"] = key
    destriptors = get_destriptor(processed_text, key)
    indicators_database = Chroma(persist_directory="./indicators_database", embedding_function=OpenAIEmbeddings())

    processed_data = {}
    processed_scores = {}
    mapping = {}
    for destriptor in destriptors:
        destriptor_text = destriptor[1].strip()
        processed_data[destriptor_text] = []
        mapping[destriptor_text] = get_mapping(article, destriptor_text, key)
        docs = indicators_database.similarity_search_with_score(destriptor_text, 10)
        right_score = 0
        left_score = 0
        center_score = 0
        for doc in docs:
            indicator = doc[0].page_content
            score = doc[1]
            try:
                check_label = check_labels[indicator]
                labelid = check_label2id[check_label]
                processed_data[destriptor_text].append([indicator, score, labelid])
                if labelid < 0:
                    right_score += 1
                elif labelid > 0:
                    left_score += 1
                else:
                    center_score += 1
            except:
                print(indicator)
        processed_scores[destriptor_text] = [right_score/(right_score+left_score+center_score)*100,left_score/(right_score+left_score+center_score)*100,center_score/(right_score+left_score+center_score)*100]
    return processed_text, processed_data, processed_scores, mapping


# Function to get the mapping result
def get_mapping(article, dep, key):
    os.environ["OPENAI_API_KEY"] = key
    llm = ChatOpenAI(model_name='gpt-3.5-turbo-16k')
    prompt = ChatPromptTemplate.from_template(map_template)
    chain = LLMChain(llm=llm, prompt=prompt)
    answer = chain.run({'text':article,'dep':dep})
    map_phrases = re.findall(r'\[(.*?)\]', answer)
    map_phrases = [phrase.strip() for phrase in map_phrases]
    return map_phrases



# Function to deal with the display of mapping
def mapping_article(article, dep, key):
    os.environ["OPENAI_API_KEY"] = key
    llm = ChatOpenAI(model_name='gpt-3.5-turbo-16k')
    prompt = ChatPromptTemplate.from_template(map_template)
    chain = LLMChain(llm=llm, prompt=prompt)
    answer = chain.run({'text':article,'dep':dep})
    map_phrases = re.findall(r'\[(.*?)\]', answer)
    new_article = article
    for phrase in map_phrases:
        phrase = phrase.strip()
        if phrase in article:
            new_article = new_article.replace(phrase,"<map_underline>"+phrase+"</map_underline>")
        else:
            print('Something is wrong!')
    return new_article








@app.route('/')
def index():
    return render_template('index.html')

@app.route('/introduction')
def introduction():
    return render_template('introduction.html')

@app.route('/examples')
def examples():
    with open('demoexample.json', 'r') as openfile:
        examples = json.load(openfile)
    return jsonify(examples)

@app.route('/process', methods=['POST'])
def process():
    article = request.form['article']
    key = request.form['keyInput']
    processed_text, descriptor_indicator, processed_scores, mapping = process_article(article,key)
    return jsonify({'processed_text': processed_text, 'processed_data': processed_scores, 'descriptor_indicator':descriptor_indicator, 'descriptor_mapping': mapping})#, 'mapping_data': mapping_representation})

@app.route('/mapping', methods=['POST'])
def mapping():
    article = request.form['article']
    dep = request.form['depInput']
    key = request.form['mapkeyInput']
    mapped_article = mapping_article(article, dep, key)
    return jsonify({'mapped_article': mapped_article})


if __name__ == '__main__':
    app.run(debug=True)
