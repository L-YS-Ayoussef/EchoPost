import React, { Component, Fragment } from 'react';
import openSocket from "socket.io-client"; // [openSocket] -> this is the function for connecting the client to the server 

import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './Feed.css';

class Feed extends Component {
  state = {
    isEditing: false,
    posts: [],
    totalPosts: 0,
    editPost: null,
    status: '',
    postPage: 1,
    postsLoading: true,
    editLoading: false
  };

  componentDidMount() {
    const graphqlQuery = {
      query: `
        {
          user {
            status
          }
        }
      `
    };
    fetch("http://localhost:5000/graphql", {
      method: "POSt", 
      headers: {
        Authorization: 'Youssef ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if (resData.errors) {
          throw new Error('Fetching status failed!');
        }

        this.setState({ status: resData.data.user.status });
      })
      .catch(this.catchError);

    this.loadPosts();
      
    const socket = openSocket("http://localhost:5000") // passing the URL of the server to the [openSocket] function 
    // Setting up the code to listen to the events got from the socket in the backend
    socket.on("posts", data => {
      if (data.action === "create" && data.post) {
        this.addPost(data.post);
      }
      if (data.action === "update" && data.post) {
        this.updatePost(data.post);
      }
      if (data.action === "delete" && data.post) {
        this.loadPosts();
      }
    })
  }

  addPost = post => {
    this.setState(prevState => {
      const updatedPosts = [...prevState.posts];
      if (prevState.postPage === 1) {
        // if (prevState.posts.length >= 2) {
        //   updatedPosts.pop(); // Removes the last post from the updatedPosts array
        // }
        updatedPosts.unshift(post); // Adds the new post to the beginning of the updatedPosts array.
      }
      return { // the returned object represents the new state and react will merge the new with the existing one, then it will update the posts and totalPosts properties in the state with the values provided in the returned object, but the other properties in the exsiting state will remain the same.
        posts: updatedPosts,
        totalPosts: prevState.totalPosts + 1
      };
    });

  }
  updatePost = post => {
    this.setState(prevState => {
      const updatedPosts = [...prevState.posts];
      const updatedPostIndex = updatedPosts.findIndex(p => p._id === post._id);
      if (updatedPostIndex > -1) {
        updatedPosts[updatedPostIndex] = post;
      }
      return {
        posts: updatedPosts
      };
    });
  }




  loadPosts = direction => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] });
    }
    let page = this.state.postPage;
    if (direction === 'next') {
      page++;
      this.setState({ postPage: page });
    }
    if (direction === 'previous') {
      page--;
      this.setState({ postPage: page });
    }

    // Note -> when dealing with query or mutation, we can name them(it will help in case of errors). Also, we can use dynamic variables instead of using ${} inside the template literal 
    const graphqlQuery = { // [FetchPosts] -> is the name of the query and also specifying the type of the variable that will be used inside the query -> ($page: Int)
      query: `
        query FetchPosts($page: Int) {
          posts(page: $page) {
            posts {
              _id
              title
              content
              imageUrl
              creator {
                name
              }
              createdAt
            }
            totalPosts
          }
        }
      `,
      variables: { // the key "page" is what will be used inside the graphql query and the value of it "page" is a js variable
        page: page
      }
    };
    fetch('http://localhost:5000/graphql', {
      method: "POST",
      headers: {
        Authorization: "Youssef " + this.props.token, 
        "Content-Type": "application/json"
      }, 
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if (resData.errors && resData.errors[0].status === 422) {
          throw new Error(
            "Validation failed. Make sure the email address isn't used yet!"
          );
        }
        if (resData.errors) {
          console.log(resData.errors);
          throw new Error('Loading Post failed!');
        }

        this.setState({
          posts: resData.data.posts.posts.map(post => {
            return{
              ...post,
              imagePath: post.imageUrl
            };
          }), 
          totalPosts: resData.data.posts.totalPosts,
          postsLoading: false
        });
      })
      .catch(this.catchError);
  };

  statusUpdateHandler = event => {
    event.preventDefault();
    const graphqlQuery = {
      query: `
        mutation UpdateUserStatus($userStatus: String!) {
          updateStatus(status: $userStatus) {
            status
          }
        }
      `,
      variables: {
        userStatus: this.state.status
      }
    };
    fetch('http://localhost:5000/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Youssef ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error("Can't update status!");
        }
        return res.json();
      })
      .then(resData => {
        console.log(resData);
      })
      .catch(this.catchError);
  };

  newPostHandler = () => {
    this.setState({ isEditing: true });
  };

  startEditPostHandler = postId => {
    this.setState(prevState => {
      const loadedPost = { ...prevState.posts.find(p => p._id === postId) };

      return {
        isEditing: true,
        editPost: loadedPost
      };
    });
  };

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null });
  };

  finishEditHandler = postData => {
    this.setState({
      editLoading: true
    });

    const formData = new FormData();
    formData.append("image", postData.image);
    if (this.state.editPost && postData.image) {
      formData.append('oldPath', this.state.editPost.imagePath);
    }
    fetch('http://localhost:5000/post-image', {
      method: 'PUT',
      headers: {
        Authorization: 'Youssef ' + this.props.token
      },
      body: formData
    })
      .then(res => res.json())
      .then(fileResData => {
        const imageUrl = fileResData.filePath || "undefined";
        
        let graphqlQuery = { // There will be a syntax error: Invalid character escape sequence -> if there is a '\' in the query
          query: `
          mutation CreateNewPost($title: String!, $content: String!, $imageUrl: String!) {
            createPost(postInput: {title: $title, content: $content, imageUrl: $imageUrl}) {
              _id
              title
              content
              imageUrl
              creator {
                name
              }
              createdAt
            }
          }
        `,
          variables: {
            title: postData.title,
            content: postData.content,
            imageUrl: imageUrl
          }
        };

        if (this.state.editPost) {
          graphqlQuery = {
            query: `
              mutation UpdateExistingPost($postId: ID!, $title: String!, $content: String!, $imageUrl: String!) {
                updatePost(id: $postId, postInput: {title: $title, content: $content, imageUrl: $imageUrl}) {
                  _id
                  title
                  content
                  imageUrl
                  creator {
                    name
                  }
                  createdAt
                }
              }
            `,
            variables: {
              postId: this.state.editPost._id,
              title: postData.title,
              content: postData.content,
              imageUrl: imageUrl
            }
          };
        }
        return fetch("http://localhost:5000/graphql", { // note -> using the "return" keyword to get the "response" of the fetch  
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Youssef " + this.props.token
          },
          body: JSON.stringify(graphqlQuery)
        })
      })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if (resData.errors && resData.errors[0].status === 422) {
          throw new Error(
            "Validation failed. Make sure the email address isn't used yet!"
          );
        }
        if (resData.errors) {
          console.log(resData.errors);
          let errMsg = 'Creating Post failed!';
          if (this.state.editPost){
            errMsg = 'Updating Post failed!'
          }
          throw new Error(errMsg);
        }

        let resDataField = 'createPost';
        if (this.state.editPost) {
          resDataField = 'updatePost';
        }
        const post = {
          _id: resData.data[resDataField]._id,
          title: resData.data[resDataField].title,
          content: resData.data[resDataField].content,
          creator: resData.data[resDataField].creator,
          createdAt: resData.data[resDataField].createdAt, 
          imagePath: resData.data[resDataField].imageUrl
        };
        this.setState(prevState => {
          let updatedPosts = [...prevState.posts];
          let updatedTotalPosts = prevState.totalPosts;
          if (prevState.editPost) {
            const postIndex = prevState.posts.findIndex(
              p => p._id === prevState.editPost._id
            );
            updatedPosts[postIndex] = post;
          } else {
            updatedTotalPosts++;
            if (prevState.posts.length >= 2) {
              updatedPosts.pop();
            }
            updatedPosts.unshift(post); // To make the created post be shown as the first item
          } 
          return {
            posts: updatedPosts,
            isEditing: false,
            editPost: null,
            editLoading: false, 
            totalPosts: updatedTotalPosts
          };
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({
          isEditing: false,
          editPost: null,
          editLoading: false,
          error: err
        });
      });
  };

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value });
  };

  deletePostHandler = postId => {
    this.setState({ postsLoading: true });

    const graphqlQuery = {
      query: `
        mutation {
          deletePost(id: "${postId}")
        }
      `
    };
    fetch(`http://localhost:5000/graphql`, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        Authorization: "Youssef " + this.props.token
      }, 
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if (resData.errors) {
          console.log(resData.errors);
          throw new Error('Deleting the post failed!');
        }
        this.setState(prevState => {
          const updatedPosts = prevState.posts.filter(p => p._id !== postId);
          return { posts: updatedPosts, postsLoading: false };
        });
        // this.loadPosts();
      })
      .catch(err => {
        console.log(err);
        this.setState({ postsLoading: false });
      });
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  catchError = error => {
    this.setState({ error: error });
  };

  render() {
    return (
      <Fragment>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <FeedEdit
          editing={this.state.isEditing}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        <section className="feed__status">
          <form onSubmit={this.statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={this.statusInputChangeHandler}
              value={this.state.status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={this.newPostHandler}>
            New Post
          </Button>
        </section>
        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 && !this.state.postsLoading ? (
            <p style={{ textAlign: 'center' }}>No posts found.</p>
          ) : null}
          {!this.state.postsLoading && (
            <Paginator
              onPrevious={this.loadPosts.bind(this, 'previous')}
              onNext={this.loadPosts.bind(this, 'next')}
              lastPage={Math.ceil(this.state.totalPosts / 2)}
              currentPage={this.state.postPage}
            >
              {this.state.posts.map(post => (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator.name}
                  date={new Date(post.createdAt).toLocaleDateString('en-US')}
                  title={post.title}
                  image={post.imageUrl}
                  content={post.content}
                  onStartEdit={this.startEditPostHandler.bind(this, post._id)}
                  onDelete={this.deletePostHandler.bind(this, post._id)}
                />
              ))}
            </Paginator>
          )}
        </section>
      </Fragment>
    );
  }
}

export default Feed;
