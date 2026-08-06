from setuptools import setup, find_packages

setup(
    name="mephistomail",
    version="1.0.0",
    description="Official Python SDK for MephistoMail - Instant Disposable Temp Mail & AI OTP Extraction API",
    long_description=open("README.md", encoding="utf-8").read(),
    long_description_content_type="text/markdown",
    author="Mert Can Yildiz",
    author_email="jokallame0@gmail.com",
    url="https://mephistomail.site",
    project_urls={
        "Homepage": "https://mephistomail.site",
        "Source": "https://github.com/jokallame350-lang/temp-mailmephisto",
        "Bug Tracker": "https://github.com/jokallame350-lang/temp-mailmephisto/issues",
    },
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Topic :: Software Development :: Testing",
        "Topic :: Utilities",
    ],
    python_requires=">=3.7",
    install_requires=[
        "requests>=2.25.0",
    ],
)
